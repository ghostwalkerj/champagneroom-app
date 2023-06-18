import mongoose from 'mongoose';

import { Show } from '$lib/models/show';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const showId = params.id;
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (showId === null) {
    return new Response('Show not found', { status: 404 });
  }
  const id = new mongoose.Types.ObjectId(showId);

  if (isFirstFetch) {
    const show = await Show.findById(id).exec();
    if (show !== undefined) {
      return new Response(JSON.stringify(show));
    }
  }
  const pipeline = [
    {
      $match: {
        'fullDocument._id': id
      }
    }
  ];
  const changeStream = Show.watch(pipeline, { fullDocument: 'updateLookup' });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
