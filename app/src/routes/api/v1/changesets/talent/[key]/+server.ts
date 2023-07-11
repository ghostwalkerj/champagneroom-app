import { Creator } from '$lib/models/creator';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const creatorKey = params.key;
  if (creatorKey === null) {
    return new Response('Creator key not found', { status: 404 });
  }
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (isFirstFetch) {
    const creator = await Creator.findOne({
      'user.address': creatorKey
    }).exec();
    if (creator !== undefined) {
      return new Response(JSON.stringify(creator));
    }
  }

  const pipeline = [{ $match: { 'fullDocument.user.address': creatorKey } }];
  const changeStream = Creator.watch(pipeline, {
    fullDocument: 'updateLookup'
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
