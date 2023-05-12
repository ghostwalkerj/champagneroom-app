import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Show as ShowEvent } from '$lib/models/show';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

/** @type {import('./$types').PageServerLoad} */
export const GET: RequestHandler<{ showId: string }> = async ({ params }) => {
  const showId = params.showId;
  if (showId === null) {
    return new Response('Show Id not found', { status: 404 });
  }
  mongoose.connect(MONGO_DB_ENDPOINT);
  const id = new mongoose.Types.ObjectId(showId);

  const pipeline = [
    {
      $match: {
        'fullDocument.show': id,
        operationType: 'insert',
      },
    },
  ];
  const changeStream = ShowEvent.watch(pipeline, { showExpandedEvents: true });
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
