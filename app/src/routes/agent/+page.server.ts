import { fail } from '@sveltejs/kit';
import mongoose from 'mongoose';
import type { Actions } from './$types';

import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { AgentModel } from '$lib/models/agent';
import { TalentModel } from '$lib/models/talent';

export const actions: Actions = {
  get_or_create_agent: async ({ request }) => {
    await mongoose.connect(MONGO_DB_ENDPOINT);

    const data = await request.formData();
    const account = data.get('account') as string;

    if (account === null) {
      return fail(400, { account, missingAccount: true });
    }

    if (!account.match(/^0x[0-9a-f]{40}$/)) {
      return fail(400, { account, badAccount: true });
    }

    let agent = await AgentModel.findOne({
      address: account,
    }).exec();
    if (agent === null) {
      console.log('creating agent');
      agent = await AgentModel.create({ address: account });
    }

    return {
      success: true,
      agent: JSON.parse(JSON.stringify(agent)),
    };
  },
  create_talent: async ({ request }) => {
    await mongoose.connect(MONGO_DB_ENDPOINT);

    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    const name = data.get('name') as string;
    const agentCommission = data.get('agentCommission') as string;

    // Validation
    if (agentId === null) {
      return fail(400, { agentId, missingAgentId: true });
    }
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (
      isNaN(+agentCommission) ||
      +agentCommission < 0 ||
      +agentCommission > 100
    ) {
      return fail(400, { agentCommission, badAgentCommission: true });
    }

    const agent = await AgentModel.findById(agentId).exec();
    if (agent === null) {
      return fail(400, { agentId, agentExists: false });
    }

    TalentModel.create({
      name,
      agentCommission: +agentCommission,
      agent,
    });

    return {
      success: true,
    };
  },
};
