import { MONGO_DB_ENDPOINT } from "$env/static/private";
import { PUBLIC_TICKET_PATH } from "$env/static/public";
import { Show } from "$lib/models/show";
import { Ticket } from "$lib/models/ticket";
import { mensNames } from "$lib/util/mensNames";
import { createPinHash } from "$lib/util/pin";
import { getShowMachineService } from "$lib/util/ssHelper";
import { error, fail, redirect } from "@sveltejs/kit";
import mongoose from "mongoose";
import { uniqueNamesGenerator } from "unique-names-generator";
import urlJoin from "url-join";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const showId = params.id;
  if (showId === null) {
    throw error(404, "Champagne Show not found");
  }

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, "Show not found");
    })
    .lean()
    .exec();

  const displayName = uniqueNamesGenerator({
    dictionaries: [mensNames],
  });

  return {
    show: JSON.parse(JSON.stringify(show)),
    displayName,
  };
};

export const actions: Actions = {
  reserve_ticket: async ({ params, cookies, request, url }) => {
    const showId = params.id;
    if (showId === null) {
      return fail(404, { showId, missingShowId: true });
    }
    const data = await request.formData();
    const name = data.get("name") as string;
    const pin = data.get("pin") as string;

    if (!name) {
      return fail(400, { name, missingName: true });
    }

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNum = /^\d+$/.test(pin);
    if (!isNum) {
      return fail(400, { pin, invalidPin: true });
    }

    mongoose.connect(MONGO_DB_ENDPOINT);
    const show = await Show.findById(showId)
      .orFail(() => {
        throw error(404, "Show not found");
      })
      .exec();

    const showService = getShowMachineService(show);

    const showState = showService.getSnapshot();
    if (
      !showState.can({
        type: "TICKET RESERVED",
      })
    ) {
      return error(501, "Show cannot Reserve Ticket"); // TODO: This should be atomic
    }

    const ticket = await Ticket.create({
      show: show._id,
      agent: show.agent,
      talent: show.talent,
      price: show.price,
      paymentAddress: "0x0000000000000000000000000000000000000000",
      ticketState: {
        reservation: {
          name,
          pin,
        },
      },
    });
    if (!ticket) {
      return error(501, "Show cannot Reserve Ticket");
    }

    showService.send("TICKET RESERVED", { ticket });

    const hash = createPinHash(ticket._id.toString(), pin);
    cookies.set("pin", hash, { path: "/" });
    const redirectUrl = urlJoin(
      url.origin,
      PUBLIC_TICKET_PATH,
      ticket._id.toString()
    );
    throw redirect(303, redirectUrl);
  },
};
