import { json } from '@sveltejs/kit';

import { WEB3STORAGE_KEY, WEB3STORAGE_PROOF } from '$env/static/private';

import { web3Upload } from '$lib/server/upload';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.formData();
  const file = body.get('file') as File;
  const response = web3Upload(WEB3STORAGE_KEY, WEB3STORAGE_PROOF, file);
  return response
    ? json({ url: response })
    : new Response(undefined, { status: 400 });
};
