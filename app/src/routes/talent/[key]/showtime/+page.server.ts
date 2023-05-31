import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  MONGO_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';
import { ShowMachineEventString } from '$lib/machines/showMachine';
import { Show } from '$lib/models/show';
import { Talent } from '$lib/models/talent';
import {
  getShowMachineService,
  getShowMachineServiceFromId,
} from '$util/serverUtil';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import urlJoin from 'url-join';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  mongoose.connect(MONGO_DB_ENDPOINT);

  const talent = await Talent.findOne({ key })
    .orFail(() => {
      throw error(404, 'Talent not found');
    })
    .lean()
    .exec();

  if (talent.activeShows.length === 0) {
    throw error(404, 'No active shows');
  }

  const showId = talent.activeShows[0];

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const showService = getShowMachineService(show);

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

export const actions: Actions = {
  end_show: async ({ request }) => {
    const data = await request.formData();

    const showId = data.get('showId') as string;

    const showService = await getShowMachineServiceFromId(showId);

    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_STOPPED })) {
      showService.send({
        type: ShowMachineEventString.SHOW_STOPPED,
      });

      return { success: true };
    }
  },
};
