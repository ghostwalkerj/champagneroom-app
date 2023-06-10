import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';

import { Show } from '$lib/models/show';
import { Talent } from '$lib/models/talent';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import {
  getShowMachineService,
  getShowMachineServiceFromId,
} from '$lib/util/util.server';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  end_show: async ({ request, locals }) => {
    const data = await request.formData();

    const showId = data.get('showId') as string;

    const redisConnection = locals.redisConnection as IORedis;

    const showService = await getShowMachineServiceFromId(
      showId,
      redisConnection
    );

    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_STOPPED })) {
      showService.send({
        type: ShowMachineEventString.SHOW_STOPPED,
      });

      return { success: true };
    }
  },
};

export const load: PageServerLoad = async ({ params, locals }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const talent = await Talent.findOne({ key })
    .orFail(() => {
      throw error(404, 'Talent not found');
    })
    .lean()
    .exec();

  const show = await Show.findOne({
    talent: talent._id,
    'showState.current': true,
  })
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const redisConnection = locals.redisConnection as IORedis;
  const showService = getShowMachineService(show, redisConnection);
  const showState = showService.getSnapshot();

  if (!showState.can({ type: ShowMachineEventString.SHOW_STARTED })) {
    const talentUrl = urlJoin(PUBLIC_TALENT_PATH, key);
    throw redirect(303, talentUrl);
  }

  if (!showState.matches('started'))
    showService.send({
      type: ShowMachineEventString.SHOW_STARTED,
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
          name: talent.name,
          affiliation: 'owner',
          lobby_bypass: true,
        },
      },
    },
    JITSI_JWT_SECRET
  );

  return {
    talent: JSON.parse(JSON.stringify(talent)),
    show: JSON.parse(JSON.stringify(show)),
    jitsiToken,
  };
};
