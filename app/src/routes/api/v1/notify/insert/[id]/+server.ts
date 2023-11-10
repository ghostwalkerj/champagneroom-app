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

  const relatedField = url.searchParams.get('relatedField');

  const objectId = new mongoose.Types.ObjectId(id);

  const matchField = relatedField
    ? 'fullDocument.' + relatedField
    : 'fullDocument.' + type;

  const pipeline = [
    {
      $match: {
        [matchField]: objectId,
        operationType: 'insert'
      }
    }
  ];
  const changeStream = mongoose.model(type).watch(pipeline, {
    showExpandedEvents: true
  });
  await changeStream.next();

  changeStream.close();
  return new Response('ok');
}) satisfies RequestHandler;
