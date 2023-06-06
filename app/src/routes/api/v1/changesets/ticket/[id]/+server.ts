import { Ticket } from '$lib/models/ticket';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

export const GET: RequestHandler<{ id: string }> = async ({ params, url }) => {
  const ticketId = params.id;
  if (ticketId === null) {
    return new Response('Ticket not found', { status: 404 });
  }
  const firstFetch = url.searchParams.get('firstFetch') || false;
  let document: string | undefined;
  const id = new mongoose.Types.ObjectId(ticketId);

  if (firstFetch) {
    const ticket = await Ticket.findById(id).lean().exec();
    if (ticket !== undefined) {
      document = JSON.stringify(ticket);
    }
  } else {
    const pipeline = [{ $match: { 'fullDocument._id': id } }];
    const changeStream = Ticket.watch(pipeline, {
      fullDocument: 'updateLookup',
    });
    const next = await changeStream.next();
    document = JSON.stringify(next.fullDocument);

    changeStream.close();
  }

  return new Response(document, {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
