import { Agent } from 'node:http';

import { fail } from '@sveltejs/kit';
import { uniqueNamesGenerator } from 'unique-names-generator';

import { womensNames } from '$lib/util/womensNames';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  get_operator: async ({ request }) => {
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
    }).exec();

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
      agent: agent.toObject({ flattenObjectIds: true }),
    };
  },
};

export const load = (async () => {
  return {};
}) satisfies PageServerLoad;
