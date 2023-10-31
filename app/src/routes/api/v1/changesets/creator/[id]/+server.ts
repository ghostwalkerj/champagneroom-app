import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';

import { Creator } from '$lib/models/creator';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const id = params.id;
  if (id === null) {
    return new Response('Creator key not found', { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _id = new Types.ObjectId(id);
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (isFirstFetch) {
    const creator = await Creator.findById({
      _id
    }).exec();
    if (creator !== undefined) {
      return new Response(JSON.stringify(creator));
    }
  }

  const pipeline = [{ $match: { 'fullDocument._id': id } }];
  const changeStream = Creator.watch(pipeline, {
    fullDocument: 'updateLookup'
  });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
