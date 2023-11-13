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
import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

import { Show } from '$lib/models/show';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import Config from '$lib/config';
import { EntityType } from '$lib/constants';
import { getShowMachineService } from '$lib/server/machinesUtil';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
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
    console.log('Creator left show');
    return { success: true };
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const creator = locals.creator;
  const user = locals.user;
  if (!creator) {
    throw redirect(302, Config.Path.creator);
  }
  if (!user) {
    throw redirect(302, Config.Path.creator);
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
    throw redirect(302, Config.Path.creator);
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
    user: user.toObject({ flattenObjectIds: true, flattenMaps: true }),
    jitsiToken
  };
};
