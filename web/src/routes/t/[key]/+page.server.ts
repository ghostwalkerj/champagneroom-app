import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_TALENT_DB_SECRET,
  JWT_TALENT_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import type { ShowDocument } from '$lib/ORM/models/show';
import { ShowCancelReason } from '$lib/ORM/models/show';
import { ShowEventType } from '$lib/ORM/models/showevent';
import type { TicketDocument } from '$lib/ORM/models/ticket';
import { TicketString } from '$lib/ORM/models/ticket';
import { TicketCancelReason, TicketStatus } from '$lib/ORM/models/ticket';
import { TransactionReasonType } from '$lib/ORM/models/transaction';
import { StorageType } from '$lib/ORM/rxdb';
import { createShowMachineService } from '$lib/machines/showMachine';
import { createTicketMachineService } from '$lib/machines/ticketMachine';
import { ActorType } from '$lib/util/constants';
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
  return talent;
};

const getShow = async (key: string) => {
  const talent = await getTalent(key);

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
  const currentShow = _currentShow ? _currentShow.toJSON() : undefined;
  const completedShows = _completedShows.map(link => link.toJSON());

  return {
    token,
    talent,
    currentShow,
    completedShows,
  };
};

export const actions: Actions = {
  update_profile_image: async ({
    params,
    request,
  }: // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  import('./$types').RequestEvent) => {
    const key = params.key;
    if (key === null) {
      throw error(404, 'Key not found');
    }
    const data = await request.formData();
    const url = data.get('url') as string;
    if (!url) {
      return fail(400, { url, missingUrl: true });
    }
    const talent = await getTalent(key);

    talent.update({
      $set: {
        profileImageUrl: url,
        updatedAt: new Date().getTime(),
      },
    });
    if (talent.currentShow) {
      const currentShow = await talent.populate('currentShow');
      currentShow.update({
        $set: {
          talentInfo: {
            ...currentShow.talentInfo,
            profileImageUrl: url,
          },
          updatedAt: new Date().getTime(),
        },
      });
    }
    return { success: true };
  },
  create_show: async ({ params, request }) => {
    const key = params.key;
    if (key === null) {
      throw error(404, 'Key not found');
    }
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const maxNumTickets = data.get('maxNumTickets') as string;

    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (!price) {
      return fail(400, { price, missingPrice: true });
    }
    if (isNaN(+price) || +price < 1 || +price > 10000) {
      return fail(400, { price, invalidPrice: true });
    }

    const talent = await getTalent(key);

    const show = await talent.createShow({
      price: +price,
      name,
      duration: +duration,
      maxNumTickets: +maxNumTickets,
    });

    return {
      show: show.toJSON(),
      success: true,
    };
  },
  cancel_show: async ({ params }) => {
    const key = params.key;
    if (key === null) {
      throw error(404, 'Key not found');
    }

    const { talent, show: cancelShow, showService } = await getShow(key);
    const showState = showService.getSnapshot();

    const cancel = {
      createdAt: new Date().getTime(),
      cancelledInState: JSON.stringify(showState.value),
      reason: ShowCancelReason.TALENT_CANCELLED,
      canceller: ActorType.TALENT,
    };

    if (showState.can({ type: 'REQUEST CANCELLATION', cancel })) {
      // Cancel the show and prevent new ticket sales, etc
      showService.send({
        type: 'REQUEST CANCELLATION',
        cancel,
      });

      cancelShow.createShowevent({
        type: ShowEventType.CANCELLATION_REQUESTED,
      });

      // Loop through all tickets and refund them
      const db = talent.collection.database;
      const tickets = (await db.tickets
        .find()
        .where('show')
        .eq(cancelShow._id)
        .exec()) as TicketDocument[];

      for (const ticket of tickets) {
        if (ticket.ticketState.status === TicketStatus.RESERVED) {
          const ticketService = createTicketMachineService({
            ticketState: ticket.ticketState,
            showState: cancelShow.showState,
            saveTicketStateCallback: ticket.saveTicketStateCallback,
          });
          ticketService.send({
            type: 'REQUEST CANCELLATION',
            cancel: {
              createdAt: new Date().getTime(),
              canceller: ActorType.TALENT,
              cancelledInState: JSON.stringify(showState.value),
              reason: TicketCancelReason.SHOW_CANCELLED,
            },
          });

          if (
            ticket.ticketState.totalPaid > ticket.ticketState.refundedAmount
          ) {
            const transaction = await ticket.createTransaction({
              hash: '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e',
              from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
              to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
              value: (
                ticket.ticketState.totalPaid - ticket.ticketState.refundedAmount
              ).toString(),
              block: 123,
              reason: TransactionReasonType.TICKET_REFUND,
            });
            ticketService.send({
              type: 'REFUND RECEIVED',
              transaction,
            });
            showService.send({
              type: 'REFUND SENT',
              transaction,
              ticket,
            });
            cancelShow.createShowevent({
              type: ShowEventType.TICKET_REFUNDED,
              ticket,
              transaction,
            });
          }
        }
      }
    }
    return { success: true };
  },
};
