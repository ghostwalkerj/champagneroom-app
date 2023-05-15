import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Show } from '$lib/models/show';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

/** @type {import('./$types').PageServerLoad} */
export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
  const showId = params.id;
  if (showId === null) {
    return new Response('Show not found', { status: 404 });
  }
  mongoose.connect(MONGO_DB_ENDPOINT);

  const id = new mongoose.Types.ObjectId(showId);

  const pipeline = [
    {
      $match: {
        'fullDocument._id': id,
      },
    },
  ];

  const changeStream = Show.watch(pipeline);
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
