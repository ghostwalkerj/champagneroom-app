import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Talent } from '$lib/models/talent';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

/** @type {import('./$types').PageServerLoad} */
export const GET: RequestHandler<{ key: string }> = async ({ params }) => {
  const talentKey = params.key;
  if (talentKey === null) {
    return new Response('Talent key not found', { status: 404 });
  }

  mongoose.connect(MONGO_DB_ENDPOINT);

  const pipeline = [{ $match: { 'fullDocument.key': talentKey } }];
  const changeStream = Talent.watch(pipeline);

  const next = await changeStream.next();
  const doc = next.fullDocument;

  changeStream.close();

  return new Response(JSON.stringify(doc), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
