import { json } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';

import { web3Upload } from '$lib/server/upload';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.formData();
  const file = body.get('file') as File;
  const response =
    env.WEB3STORAGE_KEY && env.WEB3STORAGE_PROOF
      ? web3Upload(env.WEB3STORAGE_KEY, env.WEB3STORAGE_PROOF, file)
      : undefined;
  return response
    ? json({ url: response })
    : new Response(undefined, { status: 400 });
};
