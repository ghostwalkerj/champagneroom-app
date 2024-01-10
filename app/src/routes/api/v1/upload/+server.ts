import { json } from '@sveltejs/kit';

import { web3Upload } from '$lib/server/upload';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.formData();
  const file = body.get('file') as File;
  const response = web3Upload(file);
  return response
    ? json({ url: response })
    : new Response(undefined, { status: 400 });
};
