import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Talent } from '$lib/models/talent';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

export const GET: RequestHandler<{ key: string }> = async ({ params, url }) => {
  const talentKey = params.key;
  if (talentKey === null) {
    return new Response('Talent key not found', { status: 404 });
  }
  const firstFetch = url.searchParams.get('firstFetch') || false;
  let document: string | undefined;
  mongoose.connect(MONGO_DB_ENDPOINT);

  if (firstFetch) {
    const talent = await Talent.findOne({ key: talentKey }).lean().exec();
    if (talent !== undefined) {
      document = JSON.stringify(talent);
    }
  } else {
    const pipeline = [{ $match: { 'fullDocument.key': talentKey } }];
    const changeStream = Talent.watch(pipeline, {
      fullDocument: 'updateLookup',
    });
    const next = await changeStream.next();
    document = next.fullDocument;
    changeStream.close();
  }

  return new Response(document, {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
