import { MONGO_DB_ENDPOINT } from "$env/static/private";
import { ShowEvent } from "$lib/models/showEvent";
import type { RequestHandler } from "@sveltejs/kit";
import mongoose from "mongoose";

export const GET: RequestHandler<{ showId: string }> = async ({
  params,
  url,
}) => {
  const showId = params.showId;
  if (showId === null) {
    return new Response("Show Id not found", { status: 404 });
  }
  const firstFetch = url.searchParams.get("firstFetch") || false;
  let doc: string | undefined = undefined;

  mongoose.connect(MONGO_DB_ENDPOINT);
  const id = new mongoose.Types.ObjectId(showId);
  if (firstFetch) {
    const showEvent = await ShowEvent.findOne(
      { show: id },
      {},
      { sort: { createdAt: -1 } }
    )
      .lean()
      .exec();
    if (showEvent !== undefined) {
      doc = JSON.stringify(showEvent);
    }
  } else {
    const pipeline = [
      {
        $match: {
          "fullDocument.show": id,
          operationType: "insert",
        },
      },
    ];
    const changeStream = ShowEvent.watch(pipeline, {
      showExpandedEvents: true,
    });
    const next = await changeStream.next();
    doc = JSON.stringify(next.fullDocument);
    changeStream.close();
  }

  return new Response(doc, {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};
