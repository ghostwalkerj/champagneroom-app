import type { RequestHandler } from '@sveltejs/kit';
import { Types } from 'mongoose';

import { Agent } from '$lib/models/agent';

export const GET = (async ({ params, url }) => {
  const id = params.id;
  if (id === null) {
    return new Response('Agent not found', { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _id = new Types.ObjectId(id);

  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (isFirstFetch) {
    const agent = await Agent.findById({ _id }).exec();
    if (agent !== undefined) {
      return new Response(JSON.stringify(agent));
    }
  }

  const pipeline = [{ $match: { 'fullDocument._id': id } }];
  const changeStream = Agent.watch(pipeline, {
    fullDocument: 'updateLookup'
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
