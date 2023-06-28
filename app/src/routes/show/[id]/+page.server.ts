import { error, fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import { PUBLIC_TICKET_PATH } from '$env/static/public';

import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowJobDataType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import { mensNames } from '$lib/util/mensNames';
import { createPinHash } from '$lib/util/pin';
import { getShowMachineServiceFromId } from '$lib/util/util.server';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, url, locals }) => {
    const showId = params.id;
    if (showId === null) {
      return fail(404, { showId, missingShowId: true });
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

    const isNumber = /^\d+$/.test(pin);
    if (!isNumber) {
      return fail(400, { pin, invalidPin: true });
    }

    const show = await Show.findById(showId)
      .orFail(() => {
        throw error(404, 'Show not found');
      })
      .exec();

    const redisConnection = locals.redisConnection as IORedis;
    const jobQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as Queue<ShowJobDataType, any, ShowMachineEventString>;

    const showService = await getShowMachineServiceFromId(showId, jobQueue);

    const ticket = await Ticket.create({
      show: show._id,
      agent: show.agent,
      talent: show.talent,
      price: show.price,
      paymentAddress: '0x0000000000000000000000000000000000000000',
      customerName: name,
      pin
    });
    if (!ticket) {
      return error(501, 'Show cannot Reserve Ticket');
    }

    const showState = showService.getSnapshot();

    if (
      !showState.can({
        type: ShowMachineEventString.TICKET_RESERVED,
        ticketId: ticket._id.toString(),
        customerName: name
      })
    ) {
      return error(501, 'Show cannot Reserve Ticket'); // TODO: This should be atomic
    }

    jobQueue.add(ShowMachineEventString.TICKET_RESERVED, {
      showId: show._id.toString(),
      ticketId: ticket._id.toString(),
      customerName: name
    });

    const hash = createPinHash(ticket._id.toString(), pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(
      url.origin,
      PUBLIC_TICKET_PATH,
      ticket._id.toString()
    );
    throw redirect(302, redirectUrl);
  }
};

export const load: PageServerLoad = async ({ params }) => {
  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const displayName = uniqueNamesGenerator({
    dictionaries: [mensNames]
  });

  return {
    show: show.toObject({ flattenObjectIds: true }),
    displayName
  };
};
