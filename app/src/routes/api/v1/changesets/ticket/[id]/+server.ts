import { MONGO_DB_ENDPOINT } from "$env/static/private";
import { Ticket } from "$lib/models/ticket";
import type { RequestHandler } from "@sveltejs/kit";
import mongoose from "mongoose";

export const GET: RequestHandler<{ id: string }> = async ({ params, url }) => {
  const ticketId = params.id;
  if (ticketId === null) {
    return new Response("Ticket not found", { status: 404 });
  }
  const firstFetch = url.searchParams.get("firstFetch") || false;
  let doc: string | undefined = undefined;
  const id = new mongoose.Types.ObjectId(ticketId);
  mongoose.connect(MONGO_DB_ENDPOINT);

  if (firstFetch) {
    const ticket = await Ticket.findById(id).exec();
    if (ticket !== undefined) {
      doc = JSON.stringify(ticket);
    }
  } else {
    const pipeline = [{ $match: { "fullDocument._id": id } }];
    const changeStream = Ticket.watch(pipeline, {
      fullDocument: "updateLookup",
    });
    const next = await changeStream.next();
    doc = next.fullDocument;

    changeStream.close();
  }

  return new Response(JSON.stringify(doc), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};
