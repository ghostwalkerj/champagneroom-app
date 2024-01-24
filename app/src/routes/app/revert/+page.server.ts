import { redirect } from '@sveltejs/kit';

import { AUTH_TOKEN_NAME } from '$env/static/private';

import config from '$lib/config';
import { AuthType } from '$lib/constants';
import { restoreAuthToken } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
  if (locals.authType === AuthType.IMPERSONATION) {
    const tokenName = AUTH_TOKEN_NAME || 'token';
    restoreAuthToken(cookies, tokenName);
  }
  throw redirect(302, config.PATH.app);
};
