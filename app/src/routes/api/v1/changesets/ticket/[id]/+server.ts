import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Ticket } from '$lib/models/ticket';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

/** @type {import('./$types').PageServerLoad} */
export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
  const ticketId = params.id;
  if (ticketId === null) {
    return new Response('Ticket not found', { status: 404 });
  }
  mongoose.connect(MONGO_DB_ENDPOINT);

  const id = new mongoose.Types.ObjectId(ticketId);

  const pipeline = [{ $match: { 'fullDocument._id': id } }];
  const changeStream = Ticket.watch(pipeline);
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
