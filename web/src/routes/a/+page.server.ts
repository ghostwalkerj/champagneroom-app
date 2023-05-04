import {
  JWT_AGENT_DB_SECRET,
  JWT_AGENT_DB_USER,
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { PUBLIC_RXDB_PASSWORD } from '$env/static/public';
import { agentDB } from 'pshared/src/ORM/dbs/agentDB';
import { getAgentId } from 'pshared/src/ORM/models/agent';
import { StorageType } from 'pshared/src/ORM/rxdb';
import { fail } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { Actions, PageServerLoad } from './$types';

//TODO: Only return token if agent address is good.  How?
export const load: PageServerLoad = async () => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_AGENT_DB_USER,
    },
    JWT_AGENT_DB_SECRET,
    { keyid: JWT_AGENT_DB_USER }
  );

  return { token };
};
export const actions: Actions = {
  create_agent: async ({ request }) => {
    const data = await request.formData();
    const account = data.get('account') as string;

    if (account === null) {
      return fail(400, { account, missingAccount: true });
    }

    if (!account.match(/^0x[0-9a-f]{40}$/)) {
      return fail(400, { account, badAccount: true });
    }

    const agentId = getAgentId(account);
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
        sub: JWT_MASTER_DB_USER,
      },
      JWT_MASTER_DB_SECRET,
      { keyid: JWT_MASTER_DB_USER }
    );

    const db = await agentDB(agentId, token, {
      endPoint: MASTER_DB_ENDPOINT,
      storageType: StorageType.NODE_WEBSQL,
      rxdbPassword: PUBLIC_RXDB_PASSWORD,
    });

    let agent = await db.agents.findOne(agentId).exec();
    if (agent !== null) {
      return fail(400, { account, agentExists: true });
    }

    agent = await db.agents.createAgent(account);
    return {
      success: true,
      agent: agent.toJSON(),
    };
  },
  create_talent: async ({ request }) => {
    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    const name = data.get('name') as string;
    const agentCommission = data.get('agentCommission') as string;
    const profileImageUrl = data.get('profileImageUrl') as string;

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

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
        sub: JWT_MASTER_DB_USER,
      },
      JWT_MASTER_DB_SECRET,
      { keyid: JWT_MASTER_DB_USER }
    );

    const db = await agentDB(agentId, token, {
      endPoint: MASTER_DB_ENDPOINT,
      storageType: StorageType.NODE_WEBSQL,
      rxdbPassword: PUBLIC_RXDB_PASSWORD,
    });

    const agent = await db.agents.findOne(agentId).exec();
    if (agent === null) {
      return fail(400, { agentId, agentExists: false });
    }

    await agent.createTalent({
      name,
      agentCommission: +agentCommission,
      profileImageUrl,
    });

    return {
      success: true,
      agent: agent.toJSON(),
    };
  },
};
