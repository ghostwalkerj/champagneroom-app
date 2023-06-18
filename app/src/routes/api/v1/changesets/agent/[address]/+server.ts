import type { RequestHandler } from '@sveltejs/kit';

import { Agent } from '$lib/models/agent';

export const GET = (async ({ params, url }) => {
  const address = params.address;
  if (address === null) {
    return new Response('Agent not found', { status: 404 });
  }
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (isFirstFetch) {
    const agent = await Agent.findOne({ address }).exec();
    if (agent !== undefined) {
      return new Response(JSON.stringify(agent));
    }
  }

  const pipeline = [{ $match: { 'fullDocument.address': address } }];
  const changeStream = Agent.watch(pipeline, {
    fullDocument: 'updateLookup'
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
