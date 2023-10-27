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
import type { DisputeDecision } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import type { OperatorDocument } from '$lib/models/operator';
import type { ShowDocument } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import { AuthType, User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import { EntityType } from '$lib/constants';
import { womensNames } from '$lib/womensNames';

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
      const wallet = new Wallet();
      wallet.save();
      const user = await User.create({
        name,
        authType: AuthType.SIGNING,
        address: address.toLowerCase(),
        wallet: wallet._id,
        roles: [EntityType.AGENT]
      });
      const agent = await Agent.create({
        user: user._id
      });

      return {
        agent: agent?.toObject({ flattenObjectIds: true, flattenMaps: true }),
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
    if (!name || name.length < 3 || name.length > 50) {
      name = uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    try {
      const wallet = new Wallet();
      wallet.save();
      const user = await User.create({
        name,
        authType: AuthType.UNIQUE_KEY,
        address: nanoid(30),
        wallet: wallet._id,
        roles: [EntityType.CREATOR]
      });
      const creator = await Creator.create({
        user: user._id,
        agentCommission: +commission,
        agent: new ObjectId(agentId),
        profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE
      });
      return {
        success: true,
        creatorCreated: true,
        creator: creator?.toObject({
          flattenObjectIds: true,
          flattenMaps: true
        })
      };
    } catch (error) {
      return fail(400, { err: error });
    }
  },
  update_creator: async ({ request }) => {
    const data = await request.formData();
    const creatorId = data.get('creatorId') as string;
    const userId = data.get('userId') as string;
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
    if (!userId) {
      return fail(400, { userId, badUserId: true });
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
          agentCommission: +commission,
          agent: new ObjectId(agentId)
        }
      );
      await User.findOneAndUpdate(
        {
          _id: userId
        },
        {
          name,
          active: active === 'true'
        }
      );
    } catch (error) {
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  },
  changer_user_address: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    // Validation
    if (userId === null) {
      return fail(400, { userId, missingCreatorId: true });
    }

    const address = nanoid(30);

    try {
      await User.findOneAndUpdate(
        {
          _id: userId
        },
        {
          address: address
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

    showQueue.add(ShowMachineEventString.DISPUTE_DECIDED, {
      showId,
      ticketId,
      decision
    });

    return {
      success: true
    };
  }
};

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
  }

  const operator = locals.operator as OperatorDocument;
  if (!operator) {
    throw redirect(307, operatorUrl);
  }
  const agents = await Agent.find().sort({ 'user.name': 1 });
  const creators = await Creator.find().sort({ 'user.name': 1 });

  const disputedTickets = await Ticket.find({
    'ticketState.dispute.resolved': false
  }).populate<{ show: ShowDocument }>('show');

  return {
    operator: operator.toObject({ flattenObjectIds: true, flattenMaps: true }),
    agents: agents.map((agent) =>
      agent.toObject({ flattenObjectIds: true, flattenMaps: true })
    ),
    creators: creators.map((creator) =>
      creator.toObject({ flattenObjectIds: true, flattenMaps: true })
    ),
    disputedTickets: disputedTickets.map((ticket) =>
      ticket.toObject({ flattenObjectIds: true, flattenMaps: true })
    )
  };
};
