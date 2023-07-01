import { exec } from 'node:child_process';

import { error, fail } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';

import type { CancelType } from '$lib/models/common';
import { CancelReason } from '$lib/models/common';
import { Show, ShowStatus } from '$lib/models/show';
import type { TalentType } from '$lib/models/talent';
import { Talent } from '$lib/models/talent';

import type { ShowMachineEventType } from '$lib/machines/showMachine';
import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowJobDataType } from '$lib/workers/showWorker';

import { ActorType, EntityType } from '$lib/constants';
import { getShowMachineServiceFromId } from '$lib/util/util.server';

import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const actions: Actions = {
  update_profile_image: async ({ params, request }: RequestEvent) => {
    const key = params.key;
    if (key === null) {
      throw error(404, 'Key not found');
    }
    const data = await request.formData();
    const url = data.get('url') as string;
    if (!url) {
      return fail(400, { url, missingUrl: true });
    }
    const talent = await Talent.findOneAndUpdate(
      { 'user.address': key },
      { profileImageUrl: url }
    ).exec();

    return {
      success: true,
      talent: talent?.toObject({ flattenObjectIds: true })
    };
  },
  create_show: async ({ params, request }) => {
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const capacity = data.get('capacity') as string;
    const coverImageUrl = data.get('coverImageUrl') as string;
    const key = params.key;

    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (!price) {
      return fail(400, { price, missingPrice: true });
    }
    if (Number.isNaN(+price) || +price < 1 || +price > 10_000) {
      return fail(400, { price, invalidPrice: true });
    }

    const talent = (await Talent.findOne({ 'user.address': key })
      .orFail(() => {
        throw error(404, 'Talent not found');
      })
      .exec()) as TalentType;

    const show = await Show.create({
      price: +price,
      name,
      duration: +duration,
      capacity: +capacity,
      talent: talent._id,
      agent: talent.agent,
      coverImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: +capacity
        }
      },
      talentInfo: {
        name: talent.user.name,
        profileImageUrl: talent.profileImageUrl,
        averageRating: talent.feedbackStats.averageRating,
        numberOfReviews: talent.feedbackStats.numberOfReviews
      }
    });

    return {
      success: true,
      showCreated: true,
      show: show.toObject({ flattenObjectIds: true })
    };
  },
  cancel_show: async ({ request, params, locals }) => {
    const key = params.key;
    const data = await request.formData();
    const showId = data.get('showId') as string;
    if (key === null) {
      throw error(404, 'Key not found');
    }

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as Queue<ShowJobDataType, any, ShowMachineEventString>;

    const showService = await getShowMachineServiceFromId(showId);
    const showMachineState = showService.getSnapshot();

    const cancel = {
      cancelledInState: JSON.stringify(showMachineState.value),
      reason: CancelReason.TALENT_CANCELLED,
      cancelledBy: ActorType.TALENT
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
    }) as Queue<ShowJobDataType, any, ShowMachineEventString>;

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
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const talent = await Talent.findOne({
    'user.address': key,
    'user.active': true
  })
    .orFail(() => {
      throw error(404, 'Talent not found');
    })
    .exec();

  const currentShow = await Show.findOne({
    talent: talent._id,
    'showState.current': true
  }).exec();

  const completedShows = await Show.find({
    talent: talent._id,
    'showState.status': ShowStatus.FINALIZED
  })
    .sort({ 'showState.finalize.finalizedAt': -1 })
    .limit(10)
    .exec();

  return {
    talent: talent.toObject({ flattenObjectIds: true }),
    currentShow: currentShow
      ? currentShow.toObject({ flattenObjectIds: true })
      : undefined,
    completedShows: completedShows.map((show) =>
      show.toObject({ flattenObjectIds: true })
    )
  };
};
