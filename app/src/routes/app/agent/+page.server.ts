import { error, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';
import { uniqueNamesGenerator } from 'unique-names-generator';

import { AUTH_SALT } from '$env/static/private';
import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';

import { Creator } from '$lib/models/creator';
import { AuthType, User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { EntityType } from '$lib/constants';
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
      const password = generateSillyPassword({
        wordCount: 2
      });
      const secret = nanoid();

      const wallet = new Wallet();
      await wallet.save();

      const user = await User.create({
        name,
        authType: AuthType.PASSWORD_KEY,
        secret,
        wallet: wallet._id,
        roles: [EntityType.CREATOR],
        password: `${password}${AUTH_SALT}`
      });
      const creator = await Creator.create({
        user: user._id,
        agentCommission: +commission,
        agent: agentId,
        profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE
      });
      return {
        success: true,
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
  change_user_secret: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    // Validation
    if (userId === null) {
      return fail(400, { userId, missingUserId: true });
    }

    const secret = nanoid();
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: { secret, __enc_message: false }
      }
    );

    return { success: true, secret };
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
