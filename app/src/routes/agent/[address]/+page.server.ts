import { fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import { JWT_PRIVATE_KEY } from '$env/static/private';
import {
  PUBLIC_AGENT_PATH,
  PUBLIC_DEFAULT_PROFILE_IMAGE
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Talent } from '$lib/models/talent';

import { womensNames } from '$lib/util/womensNames';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  create_talent: async ({ request }) => {
    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    let name = data.get('name') as string;
    const commission = data.get('commission') as string;
    const address = data.get('address') as string;

    // Validation
    if (agentId === null) {
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

    if (!address) {
      return fail(400, { address, missingAddress: true });
    }

    if (address.length < 30 || address.length > 50) {
      return fail(400, { address, badAddress: true });
    }

    try {
      Talent.create({
        user: {
          name,
          auth: false,
          address
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
  update_talent: async ({ request }) => {
    const data = await request.formData();
    const talentId = data.get('talentId') as string;
    const name = data.get('name') as string;
    const commission = data.get('commission') as string;
    const active = data.get('active') as string;

    // Validation
    if (talentId === null) {
      return fail(400, { talentId, missingTalentId: true });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    if (active !== 'true' && active !== 'false') {
      return fail(400, { active, badActive: true });
    }

    try {
      await Talent.findOneAndUpdate(
        {
          _id: talentId
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
  }
};

export const load: PageServerLoad = async ({ params, url, cookies }) => {
  const address = params.address;
  const agentUrl = urlJoin(url.origin, PUBLIC_AGENT_PATH);

  if (address === null) {
    throw redirect(307, agentUrl);
  }

  const authUrl = urlJoin(agentUrl, address, 'auth');

  const authToken = cookies.get('agentAuthToken');
  if (!authToken) {
    throw redirect(307, authUrl);
  }

  try {
    jwt.verify(authToken, JWT_PRIVATE_KEY);
  } catch {
    throw redirect(307, authUrl);
  }

  const agent = await Agent.findOne({ 'user.address': address })
    .orFail(() => {
      throw redirect(307, agentUrl);
    })
    .exec();

  const talents = await Talent.find({ agent: agent._id }).sort({
    'user.name': 1
  });

  return {
    agent: agent.toObject({ flattenObjectIds: true }),
    talents: talents.map((talent) =>
      talent.toObject({ flattenObjectIds: true })
    )
  };
};
