import { error, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';

import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';

import { Creator } from '$lib/models/creator';
import { AuthType } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { womensNames } from '$lib/womensNames';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
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
      Creator.create({
        user: {
          name,
          authType: AuthType.PASSWORD_KEY,
          address: nanoid(30)
        },
        wallet: wallet._id,
        agentCommission: +commission,
        agent: agentId,
        profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE
      });
    } catch (error) {
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  },
  update_creator: async ({ request }) => {
    const data = await request.formData();
    const creatorId = data.get('creatorId') as string;
    const name = data.get('name') as string;
    const commission = data.get('commission') as string;
    const active = data.get('active') as string;

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
          'user.active': active === 'true'
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
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const agent = locals.agent;
  if (!agent) {
    throw error(404, 'Agent not found');
  }

  const creators = await Creator.find({ agent: agent._id }).sort({
    'user.name': 1
  });

  return {
    agent: agent.toObject({ flattenObjectIds: true, flattenMaps: true }),
    creators: creators.map((creator) =>
      creator.toObject({ flattenObjectIds: true, flattenMaps: true })
    )
  };
};
