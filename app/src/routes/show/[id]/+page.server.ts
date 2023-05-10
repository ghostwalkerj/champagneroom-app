import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { PUBLIC_TICKET_PATH } from '$env/static/public';
import { createShowMachineService } from '$lib/machines/showMachine';
import { Show } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import { mensNames } from '$lib/util/mensNames';
import { createPinHash } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import mongoose from 'mongoose';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const load: import('./$types').PageServerLoad = async ({ params }) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  const show = await Show.findById(showId)
    .lean()
    .populate(
      'talent',
      'name profileImageUrl stats.ratingAvg stats.numCompletedShows'
    )
    .exec();

  if (!show) {
    throw error(404, 'Show not found');
  }

  const displayName = uniqueNamesGenerator({
    dictionaries: [mensNames],
  });

  return {
    show: JSON.parse(JSON.stringify(show)),
    displayName,
  };
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

    mongoose.connect(MONGO_DB_ENDPOINT);
    const show = await Show.findById(showId).exec();
    if (!show) {
      return error(404, 'Show not found');
    }
    const showService = createShowMachineService(show, {
      saveStateCallback: showState => {
        show.showState = showState;
        show.save();
      },
    });

    const showState = showService.getSnapshot();
    if (
      !showState.can({
        type: 'TICKET RESERVED',
      })
    ) {
      return error(501, 'Show cannot Reserve Ticket'); // TODO: This should be atomic
    }

    const ticket = await Ticket.create({
      show: show._id,
      price: show.price,
      paymentAddress: '0x0000000000000000000000000000000000000000',
      ticketState: {
        reservation: {
          name,
          pin,
        },
      },
    });
    if (!ticket) {
      return error(501, 'Show cannot Reserve Ticket');
    }

    showService.send('TICKET RESERVED', { ticket });

    const hash = createPinHash(ticket._id.toString(), pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(
      url.origin,
      PUBLIC_TICKET_PATH,
      ticket._id.toString()
    );
    throw redirect(303, redirectUrl);
  },
};
