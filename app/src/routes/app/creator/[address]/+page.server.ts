import { error, fail } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';

import type { CancelType } from '$lib/models/common';
import { CancelReason } from '$lib/models/common';
import type { CreatorType } from '$lib/models/creator';
import { Creator } from '$lib/models/creator';
import { Show, ShowStatus } from '$lib/models/show';

import type { ShowMachineEventType } from '$lib/machines/showMachine';
import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { ActorType, EntityType } from '$lib/constants';
import { getShowMachineServiceFromId } from '$lib/util/util.server';

import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const actions: Actions = {
  update_profile_image: async ({ params, request }: RequestEvent) => {
    const address = params.address;
    if (address === null) {
      throw error(404, 'Address not found');
    }
    const data = await request.formData();
    const url = data.get('url') as string;
    if (!url) {
      return fail(400, { url, missingUrl: true });
    }
    const creator = await Creator.findOneAndUpdate(
      { 'user.address': address },
      { profileImageUrl: url }
    ).exec();

    return {
      success: true,
      creator: creator?.toObject({ flattenObjectIds: true })
    };
  },
  create_show: async ({ params, request }) => {
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const capacity = data.get('capacity') as string;
    const coverImageUrl = data.get('coverImageUrl') as string;
    const address = params.address;

    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (!price) {
      return fail(400, { price, missingPrice: true });
    }
    if (Number.isNaN(+price) || +price < 1 || +price > 10_000) {
      return fail(400, { price, invalidPrice: true });
    }

    const creator = (await Creator.findOne({ 'user.address': address })
      .orFail(() => {
        throw error(404, 'Creator not found');
      })
      .exec()) as CreatorType;

    const show = await Show.create({
      price: +price,
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
        profileImageUrl: creator.profileImageUrl,
        averageRating: creator.feedbackStats.averageRating,
        numberOfReviews: creator.feedbackStats.numberOfReviews
      }
    });

    return {
      success: true,
      showCreated: true,
      show: show.toObject({ flattenObjectIds: true })
    };
  },
  cancel_show: async ({ request, params, locals }) => {
    const address = params.address;
    const data = await request.formData();
    const showId = data.get('showId') as string;
    if (address === null) {
      throw error(404, 'Address not found');
    }

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = await getShowMachineServiceFromId(showId);
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
        showId,
        cancel
      });
    }

    return {
      success: true,
      showCancelled: true
    };
  },
  end_show: async ({ request, locals }) => {
    const data = await request.formData();
    const showId = data.get('showId') as string;

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    let isInEscrow = false;

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = await getShowMachineServiceFromId(showId);
    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_ENDED })) {
      showQueue.add(ShowMachineEventString.SHOW_ENDED, {
        showId
      });
      isInEscrow = true;
    }

    return {
      success: true,
      inEscrow: isInEscrow
    };
  }
};
export const load: PageServerLoad = async ({ params }) => {
  const address = params.address;

  if (address === null) {
    throw error(404, 'Address not found');
  }

  const creator = await Creator.findOne({
    'user.address': address,
    'user.active': true
  })
    .orFail(() => {
      throw error(404, 'Creator not found');
    })
    .exec();

  const currentShow = await Show.findOne({
    creator: creator._id,
    'showState.current': true
  }).exec();

  const completedShows = await Show.find({
    creator: creator._id,
    'showState.status': ShowStatus.FINALIZED
  })
    .sort({ 'showState.finalize.finalizedAt': -1 })
    .limit(10)
    .exec();

  return {
    creator: creator.toObject({ flattenObjectIds: true }),
    currentShow: currentShow
      ? currentShow.toObject({ flattenObjectIds: true })
      : undefined,
    completedShows: completedShows.map((show) =>
      show.toObject({ flattenObjectIds: true })
    )
  };
};