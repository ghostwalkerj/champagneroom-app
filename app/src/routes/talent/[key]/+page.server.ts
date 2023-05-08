import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_TALENT_DB_SECRET,
  JWT_TALENT_DB_USER,
  MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_ESCROW_PERIOD, PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { ShowDocument } from '$lib/ORM/models/show';
import { ShowCancelReason } from '$lib/ORM/models/show';
import { TicketCancelReason } from '$lib/ORM/models/ticket';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { StorageType } from '$lib/ORM/rxdb';
import type { ShowStateType } from '$lib/machines/showMachine';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { ActorType } from '$lib/util/constants';
import { _escrowQueue } from '$queues/show/escrow/+server';
import { error, fail } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { Actions, PageServerLoad } from './$types';

const getTalent = async (key: string) => {
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
  return talent;
};

const getShow = async (key: string) => {
  const talent = await getTalent(key);

  const show = (await talent.populate('currentShow')) as ShowDocument;
  if (!show) {
    throw error(404, 'Show not found');
  }

  const showService = createShowMachineService(show, {
    saveState: true,
    observeState: true,
  });

  return { talent, show, showService };
};

export const load: PageServerLoad = async ({ params }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: JWT_TALENT_DB_USER,
    },
    JWT_TALENT_DB_SECRET,
    { keyid: JWT_TALENT_DB_USER }
  );

  const _talent = await getTalent(key);

  const _currentShow = await _talent.populate('currentShow');

  const _completedShows = (await _talent.populate(
    'stats.completedShows'
  )) as ShowDocument[];
  const talent = _talent.toJSON();
  const currentShow = _currentShow ? _currentShow.toJSON() : null;
  const completedShows = _completedShows.map(link => link.toJSON());

  return {
    token,
    talent,
    currentShow,
    completedShows,
  };
};
