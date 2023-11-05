import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

export const GET = (async ({ params, url }) => {
  const id = params.id;
  if (id === null) {
    return new Response('Bad Request', { status: 400 });
  }
  const type = url.searchParams.get('type');
  if (type === null) {
    return new Response('Bad Request', { status: 400 });
  }

  const objectId = new mongoose.Types.ObjectId(id);

  const pipeline = [{ $match: { 'fullDocument._id': objectId } }];

  const changeStream = mongoose.model(type).watch(pipeline, {
    fullDocument: 'updateLookup'
  });

  await changeStream.next();

  changeStream.close();
  return new Response('ok');
}) satisfies RequestHandler;
