import { Talent } from '$lib/models/talent';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const talentKey = params.key;
  if (talentKey === null) {
    return new Response('Talent key not found', { status: 404 });
  }
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (isFirstFetch) {
    const talent = await Talent.findOne({ 'user.address': talentKey }).exec();
    if (talent !== undefined) {
      return new Response(JSON.stringify(talent));
    }
  }

  const pipeline = [{ $match: { 'fullDocument.user.address': talentKey } }];
  const changeStream = Talent.watch(pipeline, {
    fullDocument: 'updateLookup'
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
