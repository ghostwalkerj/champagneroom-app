import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { ShowDocument } from '$lib/ORM/models/show';
import { ShowEventType } from '$lib/ORM/models/showEvent';
import { StorageType } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

const getShow = async (key: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );

  const db = await talentDB(key, token, {
    endPoint: PRIVATE_MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
  });
  if (!db) {
    throw error(500, 'no db');
  }
  const talent = await db.talents.findOne().where('key').eq(key).exec();
  if (!talent) {
    throw error(404, 'Talent not found');
  }

  const show = (await talent.populate('currentShow')) as ShowDocument;
  if (!show) {
    throw error(404, 'Show not found');
  }

  const showService = createShowMachineService({
    showState: show.showState,
    saveShowStateCallback: show.saveShowStateCallback,
  });

  return { talent, show, showService };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({ params }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }
  const { talent, show, showService } = await getShow(key);
  const showState = showService.getSnapshot();

  if (!showState.can({ type: 'START SHOW' })) {
    const talentUrl = urlJoin(PUBLIC_TALENT_PATH, key);
    throw redirect(303, talentUrl);
  }

  showService.send({
    type: 'START SHOW',
  });
  show.createShowEvent({
    type: ShowEventType.STARTED,
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
    talent: talent.toJSON(),
    currentShow: show.toJSON(),
    jitsiToken,
  };
};

export const actions: Actions = {
  end_show: async ({ params }) => {
    console.log('end show');

    const key = params.key;

    if (key === undefined) {
      throw error(404, 'Key not found');
    }
    const { show: endShow, showService } = await getShow(key);

    const showState = showService.getSnapshot();

    if (showState.can({ type: 'END SHOW' })) {
      // Cancel the show and prevent new ticket sales, etc
      showService.send({
        type: 'END SHOW',
      });
      endShow.createShowEvent({
        type: ShowEventType.ENDED,
      });
    }
    return { success: true };
  },
};
