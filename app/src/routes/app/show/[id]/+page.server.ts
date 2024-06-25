import { error, fail, redirect } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';
import { waitFor } from 'xstate';

import { env } from '$env/dynamic/private';

import { reserveTicketSchema } from '$lib/models/common';
import { Show, type ShowDocument } from '$lib/models/show';
import type { TicketDocument } from '$lib/models/ticket';
import { Ticket } from '$lib/models/ticket';
import { User } from '$lib/models/user';

import { createTicketMachineService } from '$lib/machines/ticketMachine';

import config from '$lib/config';
import { AuthType, UserRole } from '$lib/constants';
import { mensNames } from '$lib/mensNames';
import { createAuthToken, setAuthToken } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

const tokenName = env.AUTH_TOKEN_NAME || 'token';

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, locals }) => {
    const showId = params.id;
    if (showId === null) {
      return fail(404, { showId, missingShowId: true });
    }

    const form = await superValidate(request, zod(reserveTicketSchema));

    // Convenient validation check:
    if (!form.valid) {
      return fail(400, { form });
    }

    const name = form.data.name as string;
    const pin = form.data.pin as number[];
    const profileImage = form.data.profileImage as string;

    const show = (await Show.findById(showId)
      .orFail(() => {
        throw error(404, 'Show not found');
      })
      .exec()) as ShowDocument;

    const redisConnection = locals.redisConnection as IORedis;

    const user = await User.create({
      name,
      roles: [UserRole.TICKET_HOLDER],
      authType: AuthType.PIN,
      password: pin.join(''),
      profileImageUrl: profileImage
    });

    const ticket = (await Ticket.create({
      user: user._id,
      show: show._id,
      agent: show.agent,
      creator: show.creator,
      price: show.price
    })) as TicketDocument;
    if (!ticket) {
      console.error('Ticket cannot be created');
      return message(form, 'Show cannot reserve ticket', { status: 501 });
    }

    const ticketService = createTicketMachineService({
      ticket,
      show,
      redisConnection
    });

    ticketService.send({
      type: 'TICKET RESERVED'
    });

    await waitFor(ticketService, (state) => state.matches('reserved'));
    const redirectUrl = urlJoin(config.PATH.ticket, ticket._id.toString());

    const encAuthToken = createAuthToken({
      id: user._id.toString(),
      selector: '_id',
      authType: AuthType.PIN
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);

    ticketService.stop();

    throw redirect(302, redirectUrl);
  }
};

export const load: PageServerLoad = async (event) => {
  const showId = event.params.id;
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

  const form = await superValidate(
    {
      name: displayName,
      pin: Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
    },
    zod(reserveTicketSchema),
    {
      errors: false
    }
  );

  return {
    show: show.toObject({ flattenObjectIds: true, flattenMaps: true }),
    displayName,
    form
  };
};
