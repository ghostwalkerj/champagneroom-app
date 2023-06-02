import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Agent } from '$lib/models/agent';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

export const GET: RequestHandler<{ address: string }> = async ({
  params,
  url,
}) => {
  const address = params.address;
  if (address === null) {
    return new Response('Agent not found', { status: 404 });
  }
  const firstFetch = url.searchParams.get('firstFetch') || false;
  let document: string | undefined;

  mongoose.connect(MONGO_DB_ENDPOINT);
  if (firstFetch) {
    const agent = await Agent.findOne({ address }).exec();
    if (agent !== undefined) {
      document = JSON.stringify(agent);
    }
  } else {
    const pipeline = [{ $match: { 'fullDocument.address': address } }];
    const changeStream = Agent.watch(pipeline, {
      fullDocument: 'updateLookup',
    });
    const next = await changeStream.next();
    document = next.fullDocument;

    changeStream.close();
  }

  return new Response(JSON.stringify(document), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
