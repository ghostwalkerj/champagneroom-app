import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

import { Agent } from '$lib/models/agent';
import { Talent } from '$lib/models/talent';
import { womensNames } from '$lib/util/womensNames';
import { uniqueNamesGenerator } from 'unique-names-generator';

export const actions: Actions = {
  get_or_create_agent: async ({ request }) => {
    const data = await request.formData();
    const account = data.get('account') as string;

    if (account === null) {
      return fail(400, { account, missingAccount: true });
    }

    if (!/^0x[\da-f]{40}$/.test(account)) {
      return fail(400, { account, badAccount: true });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let agent = await Agent.findOne({
      address: account,
    })
      .lean()
      .exec();

    if (agent === null) {
      agent = await Agent.create({
        address: account,
        name:
          'Agent ' +
          uniqueNamesGenerator({
            dictionaries: [womensNames],
          }),
      });
    }

    return {
      success: true,
      agent: JSON.parse(JSON.stringify(agent)),
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
    });

    return {
      success: true,
    };
  },
};
