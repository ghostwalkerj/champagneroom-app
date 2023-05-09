import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { showDB } from '$lib/ORM/dbs/showDB';
import { StorageType } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import type { ShowDocument } from '$lib/models/show';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { Queue } from 'quirrel/sveltekit';

const getShow = async (showId: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );

  const db = await showDB(showId, token, {
    endPoint: MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
    rxdbPassword: PUBLIC_RXDB_PASSWORD,
  });
  if (!db) {
    throw error(500, 'no db');
  }

  const show = (await db.shows.findOne(showId).exec()) as ShowDocument;
  if (!show) {
    throw error(404, 'Show not found');
  }

  const showService = createShowMachineService(show, {
    saveState: true,
    observeState: false,
  });

  return { show, showService };
};

export const _graceQueue = Queue(
  'api/v1/queues/show/grace', // 👈 the route it's reachable on
  async (job: string) => {
    const { showService } = await getShow(job);

    const showState = showService.getSnapshot();

    if (showState.matches('stopped')) {
      showService.send('SHOW ENDED');
    }
  }
);

export const POST = _graceQueue;

export const prerender = false;
