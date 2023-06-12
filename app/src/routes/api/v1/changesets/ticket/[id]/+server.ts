import mongoose from 'mongoose';

import { Ticket } from '$lib/models/ticket';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const ticketId = params.id;
  if (ticketId === null) {
    return new Response('Ticket not found', { status: 404 });
  }
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  const id = new mongoose.Types.ObjectId(ticketId);

  if (isFirstFetch) {
    const ticket = await Ticket.findById(id).exec();
    if (ticket !== undefined) {
      return new Response(JSON.stringify(ticket));
    }
  }
  const pipeline = [{ $match: { 'fullDocument._id': id } }];
  const changeStream = Ticket.watch(pipeline, {
    fullDocument: 'updateLookup',
  });
  const next = await changeStream.next();
  const document = next.fullDocument;

  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
