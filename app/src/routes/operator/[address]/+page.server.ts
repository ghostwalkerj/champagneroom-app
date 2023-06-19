import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';

import { JWT_PRIVATE_KEY } from '$env/static/private';
import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Operator } from '$lib/models/operator';
import { Ticket } from '$lib/models/ticket';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
  }

  const authToken = cookies.get('authToken');
  if (!authToken || !jwt.verify(authToken, JWT_PRIVATE_KEY)) {
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
