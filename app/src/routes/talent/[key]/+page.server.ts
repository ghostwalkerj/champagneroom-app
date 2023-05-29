import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { ActorType } from '$lib/constants';
import type { ShowMachineEventType } from '$lib/machines/showMachine';
import { ShowMachineEventString } from '$lib/machines/showMachine';
import {
  Show,
  ShowCancelReason,
  ShowStatus,
  type ShowStateType,
} from '$lib/models/show';
import { Talent, type TalentDocType } from '$lib/models/talent';
import { getShowMachineServiceFromId } from '$util/serverUtil';
import { error, fail } from '@sveltejs/kit';
import mongoose from 'mongoose';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  mongoose.connect(MONGO_DB_ENDPOINT);
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const talent = await Talent.findOne({ key })
    .orFail(() => {
      throw error(404, 'Talent not found');
    })
    .lean()
    .exec();

  const showId = talent.activeShows[0];

  if (showId) {
    const activeShow = await Show.findById(showId);
    return {
      talent: JSON.parse(JSON.stringify(talent)),
      activeShow: activeShow ? JSON.parse(JSON.stringify(activeShow)) : null,
    };
  } else return { talent: JSON.parse(JSON.stringify(talent)) };
};
export const actions: Actions = {
  update_profile_image: async ({ params, request }: RequestEvent) => {
    const key = params.key;
    if (key === null) {
      throw error(404, 'Key not found');
    }
    const data = await request.formData();
    const url = data.get('url') as string;
    if (!url) {
      return fail(400, { url, missingUrl: true });
    }
    const talent = await Talent.findOneAndUpdate(
      { key },
      { profileImageUrl: url }
    ).exec();

    return { success: true, talent: JSON.parse(JSON.stringify(talent)) };
  },
  create_show: async ({ params, request }) => {
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const capacity = data.get('capacity') as string;
    const coverImageUrl = data.get('coverImageUrl') as string;
    const key = params.key;

    if (!name || name.length < 3 || name.length > 50) {
      return fail(400, { name, badName: true });
    }

    if (!price) {
      return fail(400, { price, missingPrice: true });
    }
    if (isNaN(+price) || +price < 1 || +price > 10000) {
      return fail(400, { price, invalidPrice: true });
    }

    mongoose.connect(MONGO_DB_ENDPOINT);

    const talent = (await Talent.findOne({ key })
      .orFail(() => {
        throw error(404, 'Talent not found');
      })
      .lean()
      .exec()) as TalentDocType;

    const show = await Show.create({
      price: +price,
      name,
      duration: +duration,
      capacity: +capacity,
      talent: talent._id,
      agent: talent.agent,
      coverImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: +capacity,
        },
      },
      talentInfo: {
        name: talent.name,
        profileImageUrl: talent.profileImageUrl,
        ratingAvg: talent.stats.ratingAvg,
        numReviews: talent.stats.numReviews,
      },
    });

    Talent.updateOne({ key }, { $push: { activeShows: show._id } }).exec();

    return {
      success: true,
      showCreated: true,
      show: JSON.parse(JSON.stringify(show)),
    };
  },
  cancel_show: async ({ request, params }) => {
    const key = params.key;
    const data = await request.formData();
    const showId = data.get('showId') as string;
    if (key === null) {
      throw error(404, 'Key not found');
    }

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    mongoose.connect(MONGO_DB_ENDPOINT);
    const showService = await getShowMachineServiceFromId(showId);
    const showMachineState = showService.getSnapshot();

    const cancel = {
      cancelledAt: new Date(),
      cancelledInState: JSON.stringify(showMachineState.value),
      reason: ShowCancelReason.TALENT_CANCELLED,
      requestedBy: ActorType.TALENT,
    } as ShowStateType['cancel'];

    const cancelEvent = {
      type: 'CANCELLATION INITIATED',
      cancel,
    } as ShowMachineEventType;

    if (showMachineState.can(cancelEvent)) {
      showService.send(cancelEvent);
      Talent.updateOne({ key }, { $pull: { activeShows: showId } }).exec();
    }

    const showState = showService.getSnapshot().context.showState;

    return {
      success: true,
      showState,
      showCancelled: true,
    };
  },
  end_show: async ({ request }) => {
    const data = await request.formData();
    const showId = data.get('showId') as string;

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    let inEscrow = false;
    const showService = await getShowMachineServiceFromId(showId);
    const showState = showService.getSnapshot();

    if (showState.can({ type: ShowMachineEventString.SHOW_ENDED })) {
      showService.send({
        type: ShowMachineEventString.SHOW_ENDED,
      });

      inEscrow = showService.getSnapshot().matches('inEscrow');
    }

    return {
      success: true,
      inEscrow,
    };
  },
  refund_tickets: async ({ request }) => {
    const data = await request.formData();
    const showId = data.get('showId') as string;

    if (showId === null) {
      throw error(404, 'Show ID not found');
    }

    const showService = await getShowMachineServiceFromId(showId);
    const showState = showService.getSnapshot();

    if (showState.matches('initiatedCancellation.waiting2Refund')) {
      showService.send({
        type: ShowMachineEventString.REFUND_INITIATED,
      });
    }
    return {
      success: true,
      refundInitiated: true,
    };
  },
};
