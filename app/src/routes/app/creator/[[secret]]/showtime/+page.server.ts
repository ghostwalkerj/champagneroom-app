import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';

import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import { PUBLIC_CREATOR_PATH, PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import { Show } from '$lib/models/show';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import {
  getShowMachineService,
  getShowMachineServiceFromId
} from '$lib/server/machinesUtil';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  stop_show: async ({ request, locals }) => {
    const data = await request.formData();

    const showId = data.get('showId') as string;

    const redisConnection = locals.redisConnection as IORedis;

    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    const showService = await getShowMachineServiceFromId(showId);

    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_STOPPED })) {
      showQueue.add(ShowMachineEventString.SHOW_STOPPED, {
        showId
      });
    }
    return { success: true };
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const creator = locals.creator;
  if (!creator) {
    throw redirect(302, PUBLIC_CREATOR_PATH);
  }
  const show = await Show.findOne({
    creator: creator._id,
    'showState.current': true
  })
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const redisConnection = locals.redisConnection as IORedis;
  const showQueue = new Queue(EntityType.SHOW, {
    connection: redisConnection
  }) as ShowQueueType;

  const showService = getShowMachineService(show);
  const showState = showService.getSnapshot();

  if (!showState.can({ type: ShowMachineEventString.SHOW_STARTED })) {
    throw redirect(302, PUBLIC_CREATOR_PATH);
  }

  if (!showState.matches('started'))
    showQueue.add(ShowMachineEventString.SHOW_STARTED, {
      showId: show._id.toString()
    });

  const jitsiToken = jwt.sign(
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

  return {
    creator: creator.toObject({ flattenObjectIds: true, flattenMaps: true }),
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    jitsiToken
  };
};
