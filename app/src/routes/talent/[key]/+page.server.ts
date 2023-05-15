import { MONGO_DB_ENDPOINT } from '$env/static/private';

import type { ShowMachineEventType } from '$lib/machines/showMachine';
import {
  Show,
  ShowCancelReason,
  ShowStatus,
  type ShowStateType,
} from '$lib/models/show';
import { ShowEvent } from '$lib/models/showEvent';
import { Talent, type TalentDocType } from '$lib/models/talent';
import { ActorType } from '$lib/util/constants';
import { getShowMachineServiceFromId } from '$lib/util/ssHelper';
import { error, fail } from '@sveltejs/kit';
import mongoose from 'mongoose';
import type { Actions, PageServerLoad } from './$types';

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
    .populate('activeShows')
    .exec();

  if (talent === null) {
    throw error(404, 'Talent not found');
  }

  const activeShow =
    talent.activeShows.length > 0 ? talent.activeShows[0] : null;

  const lastActiveShowEvent = activeShow
    ? await ShowEvent.findOne({ show: activeShow._id })
        .sort({ createdAt: -1 })
        .lean()
        .exec()
    : null;

  return {
    talent: JSON.parse(JSON.stringify(talent)),
    activeShow: activeShow ? JSON.parse(JSON.stringify(activeShow)) : null,
    lastActiveShowEvent: lastActiveShowEvent
      ? JSON.parse(JSON.stringify(lastActiveShowEvent))
      : null,
  };
};
export const actions: Actions = {
  update_profile_image: async ({
    params,
    request,
  }: // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  import('./$types').RequestEvent) => {
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
    const numTickets = data.get('numTickets') as string;
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
      numTickets: +numTickets,
      talent: talent._id,
      agent: talent.agent,
      coverImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: +numTickets,
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

    mongoose.connect(MONGO_DB_ENDPOINT);
    const showService = await getShowMachineServiceFromId(showId);
    const showMachineState = showService.getSnapshot();

    const cancel = {
      cancelledAt: new Date(),
      cancelledInState: JSON.stringify(showMachineState.value),
      reason: ShowCancelReason.TALENT_CANCELLED,
      canceller: ActorType.TALENT,
    } as ShowStateType['cancel'];

    const cancelEvent = {
      type: 'REQUEST CANCELLATION',
      cancel,
      tickets: [],
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
};
