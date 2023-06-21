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
    const agentCommission = data.get('agentCommission') as string;

    // Validation
    if (agentId === null) {
      return fail(400, { agentId, missingAgentId: true });
    }
    if (!name || name.length < 3 || name.length > 50) {
      name = uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
    if (
      Number.isNaN(+agentCommission) ||
      +agentCommission < 0 ||
      +agentCommission > 100
    ) {
      return fail(400, { agentCommission, badAgentCommission: true });
    }

    Talent.create({
      name,
      agentCommission: +agentCommission,
      agent: agentId,
      profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE
    });

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

  return {
    agent: agent.toObject({ flattenObjectIds: true })
  };
};
