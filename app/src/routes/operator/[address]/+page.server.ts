import { redirect } from '@sveltejs/kit';
import urlJoin from 'url-join';

import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

import { Operator } from '$lib/models/operator';

import type { PageServerLoad } from './$types';
import { Agent } from '$lib/models/agent';
import { Ticket } from '$lib/models/ticket';

export const load: PageServerLoad = async ({ params, url }) => {
  const address = params.address;
  const redirectUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, redirectUrl);
  }

  const operator = await Operator.findOne({ address })
    .orFail(() => {
      throw redirect(307, redirectUrl);
    })
    .exec();
  
  const agents = await Agent.find();

  const disputedTickets = await Ticket.find({
    'ticketState.status': 'IN_DISPUTE',
  });

  return {
    operator: operator.toObject({ flattenObjectIds: true }),
    agents: agents.map((agent) => agent.toObject({ flattenObjectIds: true })),
    disputedTickets: disputedTickets.map((ticket) => ticket.toObject({ flattenObjectIds: true })),
  };
};
