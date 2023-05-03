import {
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  MASTER_DB_ENDPOINT,
} from '$env/static/private';
import {
  PUBLIC_JITSI_DOMAIN,
  PUBLIC_RXDB_PASSWORD,
  PUBLIC_TALENT_PATH,
} from '$env/static/public';
import { talentDB } from 'plib/dist/ORM/dbs/talentDB';
import type { ShowDocument } from 'plib/dist/ORM/models/show';
import { StorageType } from 'plib/dist/ORM/rxdb';
import { createShowMachineService } from 'plib/dist/machines/showMachine';
import { createTicketMachineService } from 'plib/dist/machines/ticketMachine';
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
    endPoint: MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
    rxdbPassword: PUBLIC_RXDB_PASSWORD,
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

  const showService = createShowMachineService(show, {
    saveState: true,
    observeState: false,
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

  if (!showState.matches('started'))
    showService.send({
      type: 'START SHOW',
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
    const key = params.key;

    if (key === undefined) {
      throw error(404, 'Key not found');
    }
    const { show, showService } = await getShow(key);

    const showState = showService.getSnapshot();

    if (showState.can({ type: 'END SHOW' })) {
      showService.send({
        type: 'END SHOW',
      });

      const tickets = await show.getActiveTickets();

      for (const ticket of tickets) {
        const ticketService = createTicketMachineService(ticket, show, {
          saveState: true,
          observeState: true,
        });

        ticketService.send({
          type: 'SHOW ENDED',
        });
      }
    }
    return { success: true };
  },
};
