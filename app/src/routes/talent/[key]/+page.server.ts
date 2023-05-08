import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_TALENT_DB_SECRET,
  JWT_TALENT_DB_USER,
  MASTER_DB_ENDPOINT,
  MONGO_DB_ENDPOINT,
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
import type { Actions, PageServerLoad } from './$types';
import { Talent } from '$lib/ORM/models/talent';
import mongoose from 'mongoose';

const getTalent = async (key: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const talent = await Talent.findOne().where({ key }).exec();
  if (!talent) {
    throw error(404, 'Talent not found');
  }
  return talent;
};

const getShow = async (key: string) => {
  const talent = (await getTalent(key)) as typeof Talent;

  const show = await talent.populate('currentShow').exec();
  if (!show) {
    throw error(404, 'Show not found');
  }

  const showService = createShowMachineService(show, {
    saveState: true,
    observeState: true,
  });

  return { talent, show, showService };
};
