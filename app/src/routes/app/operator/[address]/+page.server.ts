import type { Actions, RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
  PUBLIC_DEFAULT_PROFILE_IMAGE,
  PUBLIC_OPERATOR_PATH
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { AuthType, type DisputeDecision } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import { Operator } from '$lib/models/operator';
import { Show, type ShowType } from '$lib/models/show';
import { Ticket, TicketStatus } from '$lib/models/ticket';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import { womensNames } from '$lib/util/womensNames';

import type { PageServerLoad } from './$types';

export const actions: Actions = {
  create_agent: async ({ request }: RequestEvent) => {
    const data = await request.formData();
    let name = data.get('name') as string;
    let address = data.get('address') as string;

    name = name?.trim();
    address = address?.trim();

    if (name === null || name.length <= 3) {
      return fail(400, { name, badAgentName: true });
    }

    if (address === null) {
      console.log('bad address', address);
      return fail(400, { address, badAgentAddress: true });
    }

    try {
      const agent = await Agent.create({
        'user.address': address.toLowerCase(),
        'user.name': name,
        'user.authType': AuthType.SIGNING
      });

      return {
        agent: agent?.toObject({ flattenObjectIds: true }),
        success: true,
        agentCreated: true
      };
    } catch (error_) {
      console.log('err', error_);
      return fail(400, { address, badAgentAddress: true });
    }
  },
  create_creator: async ({ request }) => {
    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    let name = data.get('name') as string;
    const commission = data.get('commission') as string;

    // Validation
    if (agentId === null || agentId === '0') {
      return fail(400, { agentId, missingAgentId: true });
    }
    if (!name || name.length < 3 || name.length > 50) {
      name = uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    try {
      const creator = await Creator.create({
        user: {
          name,
          authType: AuthType.UNIQUE_KEY,
          address: nanoid(30)
        },
        agentCommission: +commission,
        agent: new ObjectId(agentId),
        profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE
      });
      return {
        success: true,
        creatorCreated: true,
        creator: creator?.toObject({ flattenObjectIds: true })
      };
    } catch (error) {
      return fail(400, { err: error });
    }
  },
  update_creator: async ({ request }) => {
    const data = await request.formData();
    const creatorId = data.get('creatorId') as string;
    const name = data.get('name') as string;
    const commission = data.get('commission') as string;
    const active = data.get('active') as string;
    const agentId = data.get('agentId') as string;

    // Validation
    if (creatorId === null) {
      return fail(400, { creatorId, missingCreatorId: true });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    if (active !== 'true' && active !== 'false') {
      return fail(400, { active, badActive: true });
    }

    try {
      await Creator.findOneAndUpdate(
        {
          _id: creatorId
        },
        {
          'user.name': name,
          agentCommission: +commission,
          'user.active': active === 'true',
          agent: new ObjectId(agentId)
        }
      );
    } catch (error) {
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  },
  change_creator_key: async ({ request }) => {
    const data = await request.formData();
    const creatorId = data.get('creatorId') as string;

    // Validation
    if (creatorId === null) {
      return fail(400, { creatorId, missingCreatorId: true });
    }

    const address = nanoid(30);

    try {
      await Creator.findOneAndUpdate(
        {
          _id: creatorId
        },
        {
          'user.address': address
        }
      );
    } catch (error) {
      return fail(400, { err: error });
    }

    return { success: true, address };
  },
  decide_dispute: async ({ request, locals }: RequestEvent) => {
    const data = await request.formData();
    const ticketId = data.get('ticketId') as string;
    const decision = data.get('decision') as DisputeDecision;
    const showId = data.get('showId') as string;

    if (ticketId === null) {
      return fail(400, { ticketId, badTicketId: true });
    }

    if (decision === null) {
      return fail(400, { decision, badDecision: true });
    }

    if (showId === null) {
      return fail(400, { showId, badShowId: true });
    }

    const redisConnection = locals.redisConnection as IORedis;
    const showQueue = new Queue(EntityType.SHOW, {
      connection: redisConnection
    }) as ShowQueueType;

    showQueue.add(ShowMachineEventString.DISPUTE_RESOLVED, {
      showId,
      ticketId,
      decision
    });
  }
};

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
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
  const creators = await Creator.find().sort({ 'user.name': 1 });

  Show.init();

  const disputedTickets = await Ticket.find({
    'ticketState.status': TicketStatus.IN_DISPUTE
  }).populate<{ show: ShowType }>('show');

  return {
    operator: operator.toObject({ flattenObjectIds: true }),
    agents: agents.map((agent) => agent.toObject({ flattenObjectIds: true })),
    creators: creators.map((creator) =>
      creator.toObject({ flattenObjectIds: true })
    ),
    disputedTickets: disputedTickets.map((ticket) =>
      ticket.toObject({ flattenObjectIds: true })
    )
  };
};
