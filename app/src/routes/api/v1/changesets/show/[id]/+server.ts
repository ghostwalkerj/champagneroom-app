import { Show } from '$lib/models/show';
import mongoose from 'mongoose';
import type { RequestHandler } from './$types';
import { MONGO_DB_ENDPOINT } from '$env/static/private';

export const GET: RequestHandler = async ({ params, url }) => {
  const showId = params.id;
  const firstFetch = url.searchParams.get('firstFetch') || false;
  if (showId === null) {
    return new Response('Show not found', { status: 404 });
  }
  mongoose.connect(MONGO_DB_ENDPOINT);

  const id = new mongoose.Types.ObjectId(showId);

  let document: string | undefined;

  if (firstFetch) {
    const show = await Show.findById(id).lean().exec();
    if (show !== undefined) {
      document = JSON.stringify(show);
    }
  } else {
    const pipeline = [
      {
        $match: {
          'fullDocument._id': id,
        },
      },
    ];

    const changeStream = Show.watch(pipeline, { fullDocument: 'updateLookup' });
    const next = await changeStream.next();
    document = JSON.stringify(next.fullDocument);

    changeStream.close();
  }

  return new Response(document, {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
