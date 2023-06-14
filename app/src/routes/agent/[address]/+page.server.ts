import { error, fail } from '@sveltejs/kit';
import { uniqueNamesGenerator } from 'unique-names-generator';

import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';

import { Agent } from '$lib/models/agent';
import { Show } from '$lib/models/show';
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

export const load: PageServerLoad = async ({ params }) => {
  const address = params.address;

  if (address === null) {
    throw error(404, 'Address not found');
  }

  const agent = await Agent.findOne({ address })
    .orFail(() => {
      throw error(404, 'Agent not found');
    })
    .exec();

  return {
    agent: agent.toObject({ flattenObjectIds: true }),
  };
};
