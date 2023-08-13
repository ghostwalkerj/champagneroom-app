import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

import { AuthType } from '$lib/models/common';
import { Creator } from '$lib/models/creator';

import type { Actions } from './$types';

export const actions: Actions = {
  null_action: async () => {
    return {
      success: true
    };
  },
  create_creator: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const profileImageUrl = data.get('profileImageUrl') as string;
    const walletAddress = data.get('walletAddress') as string;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    try {
      Creator.create({
        user: {
          name,
          authType: AuthType.SIGNING,
          address: walletAddress.toLocaleLowerCase(),
          walletAddress: walletAddress.toLocaleLowerCase()
        },
        agentCommission: 0,
        profileImageUrl
      });
    } catch (error) {
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  }
};
