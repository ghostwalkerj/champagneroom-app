import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';

import { Show } from '$lib/models/show';
import { Talent } from '$lib/models/talent';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import {
  getShowMachineService,
  getShowMachineServiceFromId
} from '$lib/util/util.server';

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

export const load: PageServerLoad = async ({ params, locals }) => {
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

  const show = await Show.findOne({
    talent: talent._id,
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
    const talentUrl = urlJoin(PUBLIC_TALENT_PATH, key);
    throw redirect(302, talentUrl);
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
          name: talent.user.name,
          affiliation: 'owner',
          lobby_bypass: true
        }
      }
    },
    JITSI_JWT_SECRET
  );

  return {
    talent: talent.toObject({ flattenObjectIds: true }),
    show: show.toObject({ flattenObjectIds: true }),
    jitsiToken
  };
};
