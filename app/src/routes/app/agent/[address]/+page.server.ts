import { fail, redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
  PUBLIC_AGENT_PATH,
  PUBLIC_DEFAULT_PROFILE_IMAGE
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { AuthType } from '$lib/models/common';
import { Creator } from '$lib/models/creator';

import { womensNames } from '$lib/util/womensNames';

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
      Creator.create({
        user: {
          name,
          authType: AuthType.UNIQUE_KEY,
          address: nanoid(30)
        },
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

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const agentUrl = urlJoin(url.origin, PUBLIC_AGENT_PATH);

  if (address === null) {
    throw redirect(307, agentUrl);
  }

  const agent = await Agent.findOne({ 'user.address': address })
    .orFail(() => {
      throw redirect(307, agentUrl);
    })
    .exec();

  const creators = await Creator.find({ agent: agent._id }).sort({
    'user.name': 1
  });

  return {
    agent: agent.toObject({ flattenObjectIds: true }),
    creators: creators.map((creator) =>
      creator.toObject({ flattenObjectIds: true })
    )
  };
};
