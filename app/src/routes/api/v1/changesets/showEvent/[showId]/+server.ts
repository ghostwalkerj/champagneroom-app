import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

import { ShowEvent } from '$lib/models/showEvent';

export const GET = (async ({ params, url }) => {
  const showId = params.showId;
  if (showId === null) {
    return new Response('Show Id not found', { status: 404 });
  }
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  const id = new mongoose.Types.ObjectId(showId);
  if (isFirstFetch) {
    const showEvent = await ShowEvent.findOne(
      { show: id },
      {},
      { sort: { createdAt: -1 } }
    ).exec();
    if (showEvent !== undefined) {
      return new Response(JSON.stringify(showEvent));
    }
  }
  const pipeline = [
    {
      $match: {
        'fullDocument.show': id,
        operationType: 'insert'
      }
    }
  ];
  const changeStream = ShowEvent.watch(pipeline, {
    showExpandedEvents: true
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();

  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
