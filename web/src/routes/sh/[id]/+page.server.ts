import {
  JWT_CREATOR_USER,
  JWT_EXPIRY,
  JWT_PUBLIC_USER,
  JWT_SECRET,
} from '$env/static/private';
import { PUBLIC_TICKET_PATH } from '$env/static/public';
import { apiShowDB } from '$lib/ORM/dbs/apiShowDB';
import { showDB } from '$lib/ORM/dbs/showDB';
import type { ShowDocType } from '$lib/ORM/models/show';
import { StorageTypes } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import { mensNames } from '$lib/util/mensNames';
import { createPinHash } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

export const load: import('./$types').PageServerLoad = async ({ params }) => {
  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  // Because we are returning the token to the client, we only allow access to the public database
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_PUBLIC_USER,
    },
    JWT_SECRET //TODO: Need to change this to one specific to the public database
  );

  const db = await showDB(token, showId, StorageTypes.NODE_WEBSQL);
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
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_CREATOR_USER,
    },
    JWT_SECRET
  );

  const db = await apiShowDB(token, showId, StorageTypes.NODE_WEBSQL);
  if (!db) {
    throw error(500, 'no db');
  }

  const show = await db.shows.findOne(showId).exec();
  if (!show) {
    throw error(404, 'Show not found');
  }

  return show;
};

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
    const showService = createShowMachineService(
      show.showState,
      show.saveShowStateCallBack
    );
    if (!showService.getSnapshot().can('TICKET RESERVED'))
      return error(501, 'Show cannot Reserve Ticket'); // TODO: This should be atomic

    const ticket = await show.createTicket({
      name,
      pin,
    });
    showService.send('TICKET RESERVED');
    const hash = createPinHash(ticket._id, pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(url.origin, PUBLIC_TICKET_PATH, ticket._id);
    throw redirect(303, redirectUrl);
  },
};
