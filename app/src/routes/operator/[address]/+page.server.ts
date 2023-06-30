import type { Actions, RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

import { JWT_PRIVATE_KEY } from '$env/static/private';
import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Operator } from '$lib/models/operator';
import { Show, type ShowType } from '$lib/models/show';
import { Ticket, TicketStatus } from '$lib/models/ticket';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  create_agent: async ({ request }: RequestEvent) => {
    const data = await request.formData();
    let name = data.get('name') as string;
    let address = data.get('address') as string;

    name = name?.trim();
    address = address?.trim();

    if (name === null || name.length <= 3) {
      return fail(400, { name, badName: true });
    }

    if (address === null) {
      console.log('bad address', address);
      return fail(400, { address, badAddress: true });
    }

    try {
      const agent = await Agent.create({
        'user.address': address.toLowerCase(),
        'user.name': name
      });

      return {
        agent: agent?.toObject({ flattenObjectIds: true })
      };
    } catch (error_) {
      console.log('err', error_);
      return fail(400, { address, badAddress: true });
    }
  }
};

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
  }
  const authUrl = urlJoin(operatorUrl, address, 'auth');

  const authToken = cookies.get('operatorAuthToken');
  if (!authToken) {
    throw redirect(307, authUrl);
  }

  try {
    jwt.verify(authToken, JWT_PRIVATE_KEY);
  } catch {
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
  const agents = await Agent.find().sort({ 'user.name': 1 });

  Show.init();

  const disputedTickets = await Ticket.find({
    'ticketState.status': TicketStatus.IN_DISPUTE
  }).populate<{ show: ShowType }>('show');

  return {
    operator: operator.toObject({ flattenObjectIds: true }),
    agents: agents.map((agent) => agent.toObject({ flattenObjectIds: true })),
    disputedTickets: disputedTickets.map((ticket) =>
      ticket.toObject({ flattenObjectIds: true })
    )
  };
};
