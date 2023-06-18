import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import urlJoin from 'url-join';

import { PUBLIC_OPERATOR_PATH, PUBLIC_TICKET_PATH } from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Operator } from '$lib/models/operator';
import { Ticket } from '$lib/models/ticket';

import { createPinHash } from '$lib/util/pin';
import { verifySignature } from '$lib/util/web3';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  set_auth: async ({ params, cookies, request, url }) => {
    const ticketId = params.id;

    const data = await request.formData();
    const pin = data.get('pin') as string;

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNumber = /^\d+$/.test(pin);
    if (!isNumber) {
      return fail(400, { pin, invalidPin: true });
    }

    const hash = createPinHash(ticketId, pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(url.origin, PUBLIC_TICKET_PATH, ticketId);
    throw redirect(303, redirectUrl);
  }
};

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
  }

  const authToken = cookies.get('authToken');
  if (!(await verifySignature(authToken))) {
    const authUrl = urlJoin(operatorUrl, address, 'auth');
    throw redirect(307, authUrl);
  }

  const operator = await Operator.findOne({ 'user.address': address })
    .orFail(() => {
      throw redirect(307, operatorUrl);
    })
    .exec();

  // if (!operator) {
  //   operator = await Operator.create({
  //     user: {
  //       address,
  //       name: 'Big Daddy',
  //     }
  //   });
  // }
  const agents = await Agent.find();

  const disputedTickets = await Ticket.find({
    'ticketState.status': 'IN_DISPUTE'
  });

  return {
    operator: operator.toObject({ flattenObjectIds: true }),
    agents: agents.map((agent) => agent.toObject({ flattenObjectIds: true })),
    disputedTickets: disputedTickets.map((ticket) =>
      ticket.toObject({ flattenObjectIds: true })
    )
  };
};
