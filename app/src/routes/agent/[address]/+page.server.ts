import { fail, redirect } from '@sveltejs/kit';
import { uniqueNamesGenerator } from 'unique-names-generator';
import urlJoin from 'url-join';

import {
  PUBLIC_AGENT_PATH,
  PUBLIC_DEFAULT_PROFILE_IMAGE,
} from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Talent } from '$lib/models/talent';

import { womensNames } from '$lib/util/womensNames';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  get_or_create_agent: async ({ request }) => {
    const data = await request.formData();
    const address = data.get('address') as string;

    if (address === null) {
      return fail(400, { address, missingAddress: true });
    }

    if (!/^0x[\da-f]{40}$/.test(address)) {
      return fail(400, { address, badAddress: true });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let agent = await Agent.findOne({
      address,
    }).exec();

    if (agent === null) {
      agent = await Agent.create({
        address: address,
        name:
          'Agent ' +
          uniqueNamesGenerator({
            dictionaries: [womensNames],
          }),
      });
    }

    return {
      success: true,
      agent: agent.toObject({ flattenObjectIds: true }),
    };
  },
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
        dictionaries: [womensNames],
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
      profileImageUrl: PUBLIC_DEFAULT_PROFILE_IMAGE,
    });

    return {
      success: true,
    };
  },
};

export const load: PageServerLoad = async ({ params, url }) => {
  const address = params.address;
  const redirectUrl = urlJoin(url.origin, PUBLIC_AGENT_PATH);

  if (address === null) {
    throw redirect(307, redirectUrl);
  }

  const agent = await Agent.findOne({ address })
    .orFail(() => {
      throw redirect(307, redirectUrl);
    })
    .exec();

  return {
    agent: agent.toObject({ flattenObjectIds: true }),
  };
};
