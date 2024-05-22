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

  const pipeline = [{ $match: { 'documentKey._id': objectId } }];

  const changeStream = mongoose.model(type).watch(pipeline, {
    //fullDocument: 'updateLookup'
  });

  const next = await changeStream.next();
  const updatedFields = next.updateDescription.updatedFields;
  console.log(updatedFields);
  changeStream.close();
  const response = new Response(JSON.stringify(updatedFields));
  return response;
}) satisfies RequestHandler;
