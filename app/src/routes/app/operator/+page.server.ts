import type { Actions, RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';
import { uniqueNamesGenerator } from 'unique-names-generator';

import { PASSWORD_SALT } from '$env/static/private';

import { Agent } from '$lib/models/agent';
import type { DisputeDecision } from '$lib/models/common';
import { Creator } from '$lib/models/creator';
import type { OperatorDocument } from '$lib/models/operator';
import type { ShowDocument } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { ShowMachineEventString } from '$lib/machines/showMachine';

import type { ShowQueueType } from '$lib/workers/showWorker';

import Config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';
import { womensNames } from '$lib/womensNames';

import type { PageServerLoad } from './$types';
const websiteUrl = Config.PATH.websiteUrl;

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
      console.error('bad address', address);
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
        user: user._id,
        defaultCommissionRate: Config.UI.defaultCommissionRate
      });

      return {
        agent: agent?.toObject({ flattenObjectIds: true, flattenMaps: true }),
        success: true,
        agentCreated: true
      };
    } catch (error_) {
      console.error('err', error_);
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

    const agent =
      agentId && agentId !== '0' ? new ObjectId(agentId) : undefined;

    try {
      const wallet = new Wallet();
      await wallet.save();

      const password = generateSillyPassword({
        wordCount: 2
      });

      const user = await User.create({
        name,
        authType: AuthType.PATH_PASSWORD,
        wallet: wallet._id,
        roles: [EntityType.CREATOR],
        password: `${password}${PASSWORD_SALT}`
      });
      const creator = await Creator.create({
        user: user._id,
        commissionRate: +commission,
        agent,
        profileImageUrl: Config.UI.defaultProfileImage
      });
      return {
        success: true,
        creatorCreated: true,
        creator: creator?.toObject({
          flattenObjectIds: true,
          flattenMaps: true
        }),
        password
      };
    } catch (error: unknown) {
      console.error('err', error);
      if (error instanceof Error) {
        return fail(400, { err: error.toString() });
      }
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
          commissionRate: +commission,
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
  change_user_secret: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    const password = generateSillyPassword({
      wordCount: 2
    });

    // Validation
    if (userId === null) {
      return fail(400, { userId, missingUserId: true });
    }

    const secret = nanoid();
    const user = await User.findById(userId);
    if (!user) {
      return fail(400, { userId, missingUserId: true });
    }
    user.secret = secret;
    user.password = `${password}${PASSWORD_SALT}`;
    user.save();

    return { success: true, secret, password };
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

    showQueue.close();

    return {
      success: true
    };
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const operator = locals.operator as OperatorDocument;
  const user = locals.user as UserDocument;
  if (!operator) {
    throw redirect(307, websiteUrl);
  }
  const agents = await Agent.find().sort({ 'user.name': 1 });
  const creators = await Creator.find().sort({ 'user.name': 1 });

  const disputedTickets = await Ticket.find({
    'ticketState.dispute.resolved': false
  }).populate<{ show: ShowDocument }>('show');

  return {
    operator: operator.toObject({ flattenObjectIds: true, flattenMaps: true }),
    user: user.toObject({ flattenObjectIds: true, flattenMaps: true }),
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
