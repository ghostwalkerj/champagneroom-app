import type { Actions, RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { Queue } from 'bullmq';
import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';

import { env } from '$env/dynamic/private';

import { Agent } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import type { OperatorDocument } from '$lib/models/operator';
import type { ShowDocument } from '$lib/models/show';
import { Ticket } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import type { ShowQueueType } from '$lib/workers/showWorker';

import config from '$lib/config';
import type { DisputeDecision } from '$lib/constants';
import {
  AuthType,
  EntityType,
  ShowMachineEventString,
  TicketStatus
} from '$lib/constants';
import {
  backupAuthToken,
  createAuthToken,
  setAuthToken
} from '$lib/server/auth';

import type { PageServerLoad } from './$types';
const websiteUrl = config.PATH.websiteUrl;

export const actions: Actions = {
  impersonateUser: async ({ request, cookies }) => {
    const data = await request.formData();
    const impersonateId = data.get('impersonateId') as string;
    const tokenName = env.AUTH_TOKEN_NAME || 'token';
    if (!impersonateId) {
      return fail(400, { impersonateId, missingId: true });
    }

    backupAuthToken(cookies, tokenName);
    const encAuthToken = createAuthToken({
      id: impersonateId,
      selector: '_id',
      authType: AuthType.IMPERSONATION
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);
    throw redirect(303, config.PATH.app);
  },

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
        defaultCommissionRate: config.UI.defaultCommissionRate
      });

      return {
        agent: agent?.toJSON({ flattenMaps: true, flattenObjectIds: true }),
        success: true,
        agentCreated: true
      };
    } catch (error_) {
      console.error('err', error_);
      return fail(400, { address, badAgentAddress: true });
    }
  },

  create_creator: async ({ request }) => {
    console.log(env.MONGO_DB_ENDPOINT);
    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    const name = data.get('name') as string;
    const commission = data.get('commission') as string;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badCreatorName: true });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    const agent = agentId && agentId !== '0' ? agentId : undefined;

    try {
      const wallet = new Wallet();
      await wallet.save();

      const password = generateSillyPassword({
        wordCount: 2
      });

      console.log(env.PASSWORD_SALT);
      const user = await User.create({
        name,
        authType: AuthType.PATH_PASSWORD,
        wallet: wallet._id,
        roles: [EntityType.CREATOR],
        password: `${password}${env.PASSWORD_SALT}`
      });
      const creator = await Creator.create({
        user: user._id,
        commissionRate: +commission,
        agent,
        profileImageUrl: config.UI.defaultProfileImage
      });
      return {
        success: true,
        creatorCreated: true,
        creator: creator?.toJSON({
          flattenMaps: true,
          flattenObjectIds: true
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
      console.error('bad creatorId', creatorId);
      return fail(400, { creatorId, missingCreatorId: true });
    }

    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      console.error('bad commission', commission);
      return fail(400, { commission, badCommission: true });
    }
    if (!userId) {
      console.error('bad userId', userId);
      return fail(400, { userId, badUserId: true });
    }

    if (active !== 'true' && active !== 'false') {
      console.error('bad active', active);
      return fail(400, { active, badActive: true });
    }

    try {
      await Creator.findOneAndUpdate(
        {
          _id: creatorId
        },
        {
          commissionRate: +commission,
          agent: agentId ?? undefined
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
      console.error('err', error);
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  },

  update_agent: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;
    const name = data.get('name') as string;
    const active = data.get('active') as string;
    const address = data.get('address') as string;

    // Validation
    if (!userId) {
      console.error('bad userId', userId);
      return fail(400, { userId, badUserId: true });
    }

    if (active !== 'true' && active !== 'false') {
      console.error('bad active', active);
      return fail(400, { active, badActive: true });
    }

    try {
      await User.findOneAndUpdate(
        {
          _id: userId
        },
        {
          name,
          active: active === 'true',
          address: address.toLowerCase()
        }
      );
    } catch (error) {
      console.error('err', error);
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
    user.password = `${password}${env.PASSWORD_SALT}`;
    user.updateOne();

    return { success: true, secret, password };
  },

  decide_dispute: async ({ request, locals }: RequestEvent) => {
    const data = await request.formData();
    const ticketId = data.get('ticketId') as string;
    const showId = data.get('showId') as string;
    const decision = data.get('decision') as DisputeDecision;

    if (ticketId === null) {
      return fail(400, { ticketId, badTicketId: true });
    }

    if (decision === null) {
      return fail(400, { decision, badDecision: true });
    }

    if (showId === null) {
      return fail(400, { showId, badShowId: true });
    }

    const redisConnection = locals.redisConnection;
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

  // const disputedTickets = await Ticket.find({
  //   'ticketState.dispute.resolved': false
  // }).populate<{ show: ShowDocument }>('show');

  const disputedTickets = await Ticket.find({
    'ticketState.status': TicketStatus.IN_DISPUTE
  }).populate<{ show: ShowDocument }>('show');

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _disputedTickets = disputedTickets.map((ticket) =>
    JSON.parse(
      JSON.stringify(
        ticket.toJSON({ flattenMaps: true, flattenObjectIds: true })
      )
    )
  );

  return {
    operator: operator.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    user: user.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    agents: agents.map((agent) =>
      agent.toJSON({ flattenMaps: true, flattenObjectIds: true })
    ),
    creators: creators.map((creator) =>
      creator.toJSON({ flattenMaps: true, flattenObjectIds: true })
    ),
    disputedTickets: _disputedTickets
  };
};
