import { error, fail } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import type { SuperValidated } from 'sveltekit-superforms';
import { message, superValidate } from 'sveltekit-superforms/server';

import {
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD,
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  WEB3STORAGE_KEY,
  WEB3STORAGE_PROOF
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import type { CancelType } from '$lib/models/common';
import { Creator, type CreatorDocument } from '$lib/models/creator';
import {
  Room,
  roomCRUDSchema,
  type RoomDocument,
  roomSchema
} from '$lib/models/room';
import { Show, showCRUDSchema, type ShowDocument } from '$lib/models/show';
import { ShowEvent, type ShowEventDocument } from '$lib/models/showEvent';
import type { UserDocument } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';

import type { ShowMachineEventType } from '$lib/machines/showMachine';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';
import type { ShowQueueType } from '$lib/workers/showWorker';

import {
  ActorType,
  CancelReason,
  CurrencyType,
  EntityType,
  ShowMachineEventString,
  ShowStatus
} from '$lib/constants';
import { rateCryptosRateGet } from '$lib/ext/bitcart';
import {
  createBitcartToken,
  PayoutJobType,
  PayoutReason,
  requestPayoutSchema
} from '$lib/payout';
import { getShowMachineService } from '$lib/server/machinesUtil';
import { web3Upload } from '$lib/server/upload';

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
      creator: creator?.toJSON({ flattenMaps: true, flattenObjectIds: true })
    };
  },
  create_show: async ({ locals, request }) => {
    const form = (await superValidate(
      request,
      showCRUDSchema
    )) as SuperValidated<typeof showCRUDSchema>;

    if (!form.valid) {
      console.log(form.data);
      return fail(400, { form });
    }
    const creator = locals.creator as CreatorDocument;

    const show = (await Show.create({
      ...form.data,
      creator: creator._id,
      _id: new ObjectId(),
      agent: creator.agent,
      coverImageUrl: creator.user.profileImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: form.data.capacity
        }
      },
      creatorInfo: {
        name: creator.user.name,
        profileImageUrl: creator.user.profileImageUrl,
        averageRating: creator.feedbackStats.averageRating,
        numberOfReviews: creator.feedbackStats.numberOfReviews
      }
    })) as ShowDocument;

    return {
      success: true,
      showCreated: true,
      show: show.toJSON({ flattenMaps: true, flattenObjectIds: true }),
      form
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

    const showService = getShowMachineService(show);
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
    const form = await superValidate(request, requestPayoutSchema);
    const { walletId, amount, destination, payoutReason, jobType } = form.data;

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const redisConnection = locals.redisConnection as IORedis;
      const payoutQueue = new Queue(EntityType.PAYOUT, {
        connection: redisConnection
      }) as PayoutQueueType;

      payoutQueue.add(jobType, {
        walletId,
        amount,
        destination,
        payoutReason
      });

      payoutQueue.close();
    } catch {
      return message(form, 'Error requesting payout');
    }
    return message(form, 'Payout requested successfully');
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
  },
  upsert_room: async ({ request, locals }) => {
    const creator = locals.creator as CreatorDocument;
    const formData = await request.formData();

    const form = await superValidate(formData, roomCRUDSchema);

    const isUpdate = !!form.data._id;
    // Convenient validation check:
    if (!form.valid) {
      // Again, return { form } and things will just work.
      return fail(400, { form });
    }
    const image =
      formData.get('images') && (formData.get('images') as unknown as [File]);

    if (image instanceof File && image.size > 0) {
      // upload image to web3
      const url = await web3Upload(WEB3STORAGE_KEY, WEB3STORAGE_PROOF, image);
      form.data.bannerImageUrl = url;
    }

    form.data.uniqueUrl = encodeURIComponent(form.data.uniqueUrl);

    Room.init();

    try {
      if (isUpdate) {
        const room = (await Room.findOneAndUpdate(
          { _id: form.data._id },
          form.data,
          { new: true }
        )) as RoomDocument;
        if (!room) {
          throw error(404, 'Room not found');
        }
        return {
          form,
          room: room.toJSON({ flattenMaps: true, flattenObjectIds: true })
        };
      } else {
        // insert new room
        const room = (await Room.create({
          ...form.data,
          _id: new ObjectId()
        })) as RoomDocument;
        Creator.updateOne(
          { _id: creator._id },
          {
            $set: {
              room: room._id
            }
          }
        ).exec();
        return {
          form,
          room: room.toJSON({ flattenMaps: true, flattenObjectIds: true })
        };
      }
    } catch (error_) {
      console.error(error_);
      throw error(500, 'Error upserting room');
    }
  }
};
export const load: PageServerLoad = async ({ locals }) => {
  const creator = locals.creator as CreatorDocument;
  const user = locals.user;
  if (!creator) {
    throw error(404, 'Creator not found');
  }

  const show = locals.show as ShowDocument;
  const room = locals.room as RoomDocument;
  let showEvent: ShowEventDocument | undefined;

  if (show) {
    const se = await ShowEvent.find(
      { show: show._id },
      {},
      { sort: { createdAt: -1 } }
    ).limit(1);
    if (se && se[0]) showEvent = se[0];
  }

  const completedShows = (await Show.find({
    creator: creator._id,
    'showState.status': ShowStatus.FINALIZED
  })
    .sort({ 'showState.finalize.finalizedAt': -1 })
    .limit(10)
    .exec()) as ShowDocument[];

  const wallet = locals.wallet as WalletDocument;

  // return the rate of exchange for UI from bitcart
  const token = await createBitcartToken(
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
        room: show.conferenceKey,
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
    (await rateCryptosRateGet(
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
    )) || undefined;

  const roomForm = room
    ? await superValidate(
        room.toJSON({
          flattenMaps: true,
          flattenObjectIds: true
        }),
        roomSchema
      )
    : ((await superValidate(roomSchema)) as SuperValidated<typeof roomSchema>);

  const createShowForm = (await superValidate(
    showCRUDSchema
  )) as SuperValidated<typeof showCRUDSchema>;

  const payoutForm = await superValidate(
    {
      amount: 0,
      destination: user?.address,
      walletId: wallet._id.toString(),
      payoutReason: PayoutReason.CREATOR_PAYOUT,
      jobType: PayoutJobType.CREATE_PAYOUT
    },
    requestPayoutSchema,
    { errors: false }
  );

  return {
    payoutForm,
    createShowForm,
    roomForm,
    creator: creator.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    user: user?.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    show: show
      ? show.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    showEvent: showEvent
      ? showEvent.toJSON({
          flattenMaps: true,
          flattenObjectIds: true
        })
      : undefined,
    completedShows: completedShows.map((show) =>
      show.toJSON({ flattenMaps: true, flattenObjectIds: true })
    ),
    wallet: wallet.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    exchangeRate: exchangeRate?.data as string,
    jitsiToken,
    room: room
      ? room.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined
  };
};
