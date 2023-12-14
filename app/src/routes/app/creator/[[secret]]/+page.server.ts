import { error, fail } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD,
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import type { CancelType } from '$lib/models/common';
import { CancelReason } from '$lib/models/common';
import type { CreatorDocument } from '$lib/models/creator';
import type { ShowDocument } from '$lib/models/show';
import { Show, ShowStatus } from '$lib/models/show';
import type { ShowEventDocument } from '$lib/models/showEvent';
import { ShowEvent } from '$lib/models/showEvent';
import type { UserDocument } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';
import { Wallet, WalletStatus } from '$lib/models/wallet';

import type { ShowMachineEventType } from '$lib/machines/showMachine';
import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';
import type { ShowQueueType } from '$lib/workers/showWorker';

import { ActorType, CurrencyType, EntityType } from '$lib/constants';
import { rateCryptosRateGet } from '$lib/ext/bitcart';
import { createAuthToken, PayoutJobType, PayoutReason } from '$lib/payment';
import { getShowMachineService } from '$lib/server/machinesUtil';

import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const actions: Actions = {
  update_profile_image: async ({ locals, request }: RequestEvent) => {
    const data = await request.formData();
    const url = data.get('url') as string;
    if (!url) {
      return fail(400, { url, missingUrl: true });
    }
    const user = locals.user as UserDocument;
    const creator = locals.creator as CreatorDocument;
    user.profileImageUrl = url;
    await user.save();
    creator.user.profileImageUrl = url;

    return {
      success: true,
      creator: creator?.toObject({ flattenObjectIds: true, flattenMaps: true })
    };
  },
  create_show: async ({ locals, request }) => {
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const capacity = data.get('capacity') as string;
    const coverImageUrl = data.get('coverImageUrl') as string;

    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (!price) {
      return fail(400, { price, missingPrice: true });
    }
    if (Number.isNaN(+price) || +price < 0 || +price > 10_000) {
      return fail(400, { price, invalidPrice: true });
    }
    const creator = locals.creator as CreatorDocument;

    const show = new Show({
      price: {
        amount: +price,
        currency: CurrencyType.USD,
        rate: 1
      },
      name,
      duration: +duration,
      capacity: +capacity,
      creator: creator._id,
      agent: creator.agent,
      coverImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: +capacity
        }
      },
      creatorInfo: {
        name: creator.user.name,
        profileImageUrl: creator.user.profileImageUrl,
        averageRating: creator.feedbackStats.averageRating,
        numberOfReviews: creator.feedbackStats.numberOfReviews
      }
    });

    show.save();

    return {
      success: true,
      showCreated: true,
      show: show.toObject({ flattenObjectIds: true, flattenMaps: true })
    };
  },
  cancel_show: async ({ locals }) => {
    const redisConnection = locals.redisConnection as IORedis;
    const show = locals.show as ShowDocument;
    if (!show) {
      throw error(404, 'Show not found');
    }
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = getShowMachineService(show);
    const showMachineState = showService.getSnapshot();

    const cancel = {
      cancelledInState: JSON.stringify(showMachineState.value),
      reason: CancelReason.CREATOR_CANCELLED,
      cancelledBy: ActorType.CREATOR
    } as CancelType;

    const cancelEvent = {
      type: 'CANCELLATION INITIATED',
      cancel
    } as ShowMachineEventType;

    if (showMachineState.can(cancelEvent)) {
      showQueue.add(ShowMachineEventString.CANCELLATION_INITIATED, {
        showId: show._id.toString(),
        cancel
      });
    }

    showQueue.close();
    showService.stop();

    return {
      success: true,
      showCancelled: true
    };
  },
  end_show: async ({ locals }) => {
    const show = locals.show as ShowDocument;

    if (show === null) {
      throw error(404, 'Show ID not found');
    }

    let isInEscrow = false;

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = await getShowMachineService(show);
    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_ENDED })) {
      showQueue.add(ShowMachineEventString.SHOW_ENDED, {
        showId: show._id.toString()
      });
      isInEscrow = true;
    }

    showQueue.close();
    showService.stop();

    return {
      success: true,
      inEscrow: isInEscrow
    };
  },
  request_payout: async ({ request, locals }) => {
    const data = await request.formData();
    const amount = data.get('amount') as string;
    const destination = data.get('destination') as string;
    const walletId = data.get('walletId') as string;

    if (!amount) {
      return fail(400, { amount, missingAmount: true });
    }
    if (Number.isNaN(+amount) || +amount < 0) {
      return fail(400, { amount, invalidAmount: true });
    }
    if (!destination) {
      return fail(400, { destination, missingDestination: true });
    }

    const wallet = await Wallet.findOne({ _id: walletId });

    if (!wallet) {
      throw error(404, 'Wallet not found');
    }

    if (wallet.availableBalance < +amount) {
      return fail(400, { amount, insufficientBalance: true });
    }

    if (wallet.status === WalletStatus.PAYOUT_IN_PROGRESS) {
      return fail(400, { amount, payoutInProgress: true });
    }

    const redisConnection = locals.redisConnection as IORedis;
    const payoutQueue = new Queue(EntityType.PAYOUT, {
      connection: redisConnection
    }) as PayoutQueueType;

    payoutQueue.add(PayoutJobType.CREATE_PAYOUT, {
      walletId,
      amount: +amount,
      destination,
      payoutReason: PayoutReason.CREATOR_PAYOUT
    });

    payoutQueue.close();

    return {
      success: true
    };
  },
  leave_show: async ({ locals }) => {
    const redisConnection = locals.redisConnection as IORedis;
    const show = locals.show;
    if (!show) {
      throw error(404, 'Show not found');
    }

    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = getShowMachineService(show);

    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_STOPPED })) {
      showQueue.add(ShowMachineEventString.SHOW_STOPPED, {
        showId: show._id.toString()
      });
    }
    showQueue.close();
    showService.stop();
    console.log('Creator left show');
    return { success: true };
  },
  start_show: async ({ locals }) => {
    const show = locals.show as ShowDocument;
    if (!show) {
      throw error(404, 'Show not found');
    }
    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = getShowMachineService(show);
    const showState = showService.getSnapshot();

    if (!showState.matches('started'))
      showQueue.add(ShowMachineEventString.SHOW_STARTED, {
        showId: show._id.toString()
      });

    showQueue.close();
    showService.stop();
  }
};
export const load: PageServerLoad = async ({ locals }) => {
  const creator = locals.creator as CreatorDocument;
  const user = locals.user;
  if (!creator) {
    throw error(404, 'Creator not found');
  }

  const show = locals.show as ShowDocument;
  let showEvent: ShowEventDocument | undefined;

  if (show) {
    const se = await ShowEvent.find(
      { show: show._id },
      {},
      { sort: { createdAt: -1 } }
    ).limit(1);
    if (se && se[0]) showEvent = se[0];
  }

  const completedShows = await Show.find({
    creator: creator._id,
    'showState.status': ShowStatus.FINALIZED
  })
    .sort({ 'showState.finalize.finalizedAt': -1 })
    .limit(10)
    .exec();

  const wallet = locals.wallet as WalletDocument;

  // return the rate of exchange for UI from bitcart
  const token = await createAuthToken(
    BITCART_EMAIL,
    BITCART_PASSWORD,
    BITCART_API_URL
  );

  let jitsiToken: string | undefined;

  if (show) {
    jitsiToken = jwt.sign(
      {
        aud: 'jitsi',
        iss: JITSI_APP_ID,
        exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
        sub: PUBLIC_JITSI_DOMAIN,
        room: show.roomId,
        moderator: true,
        context: {
          user: {
            name: creator.user.name,
            affiliation: 'owner',
            lobby_bypass: true
          }
        }
      },
      JITSI_JWT_SECRET
    );
  }

  const exchangeRate =
    ((await rateCryptosRateGet(
      {
        currency: wallet.currency,
        fiat_currency: CurrencyType.USD
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )) as AxiosResponse<string>) || undefined;

  return {
    creator: creator.toObject({ flattenObjectIds: true, flattenMaps: true }),
    user: user?.toObject({ flattenObjectIds: true, flattenMaps: true }),
    show: show
      ? show.toObject({ flattenObjectIds: true, flattenMaps: true })
      : undefined,
    showEvent: showEvent
      ? showEvent.toObject({
          flattenObjectIds: true,
          flattenMaps: true
        })
      : undefined,
    completedShows: completedShows.map((show) =>
      show.toObject({ flattenObjectIds: true, flattenMaps: true })
    ),
    wallet: wallet.toObject({ flattenObjectIds: true, flattenMaps: true }),
    exchangeRate: exchangeRate?.data,
    jitsiToken
  };
};
