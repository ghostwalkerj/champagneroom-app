import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_SHOW_DB_SECRET,
  JWT_SHOW_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_TICKET_PATH } from '$env/static/public';
import { showDB } from '$lib/ORM/dbs/showDB';
import type { ShowDocType } from '$lib/ORM/models/show';
import { ShowEventType } from '$lib/ORM/models/showEvent';
import { StorageType } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import { mensNames } from '$lib/util/mensNames';
import { createPinHash } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({ params }) => {
  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: JWT_SHOW_DB_USER,
    },
    JWT_SHOW_DB_SECRET,
    { keyid: JWT_SHOW_DB_USER }
  );

  const masterToken = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );

  const db = await showDB(showId, masterToken, {
    endPoint: PRIVATE_MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
  });
  if (!db) {
    throw error(500, 'no db');
  }

  const _show = await db.shows.findOne(showId).exec();

  if (!_show) {
    throw error(404, 'Show not found');
  }

  const show = _show.toJSON() as ShowDocType;

  const displayName = uniqueNamesGenerator({
    dictionaries: [mensNames],
  });

  return {
    token,
    show,
    displayName,
  };
};

const getShow = async (showId: string) => {
  const masterToken = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );
  const db = await showDB(showId, masterToken, {
    endPoint: PRIVATE_MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
  });
  if (!db) {
    throw error(500, 'no db');
  }

  const show = await db.shows.findOne(showId).exec();
  if (!show) {
    throw error(404, 'Show not found');
  }

  return show;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const actions: import('./$types').Actions = {
  reserve_ticket: async ({ params, cookies, request, url }) => {
    const showId = params.id;
    if (showId === null) {
      throw error(404, 'Key not found');
    }
    const data = await request.formData();
    const name = data.get('name') as string;
    const pin = data.get('pin') as string;

    if (!name) {
      return fail(400, { name, missingName: true });
    }

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNum = /^\d+$/.test(pin);
    if (!isNum) {
      return fail(400, { pin, invalidPin: true });
    }

    const show = await getShow(showId);
    const showService = createShowMachineService({
      showState: show.showState,
      saveShowStateCallback: show.saveShowStateCallback,
    });
    if (show.showState.ticketsAvailable == 0) {
      return error(501, 'Show cannot Reserve Ticket'); // TODO: This should be atomic
    }

    const ticket = await show.createTicket({
      name,
      pin,
    });

    show.createShowEvent({
      type: ShowEventType.TICKET_RESERVED,
      ticket: ticket,
    });

    showService.send('TICKET RESERVED');

    const hash = createPinHash(ticket._id, pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(url.origin, PUBLIC_TICKET_PATH, ticket._id);
    throw redirect(303, redirectUrl);
  },
};
