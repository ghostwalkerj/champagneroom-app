import { MONGO_DB_ENDPOINT } from '$env/static/private';
import {
  Show,
  ShowCancelReason,
  ShowStateType,
  ShowStatus,
} from '$lib/models/show';
import { Talent } from '$lib/models/talent';
import { error, fail } from '@sveltejs/kit';
import mongoose from 'mongoose';
import type { Actions, PageServerLoad } from './$types';
import { createShowMachineService } from '$lib/machines/showMachine';
import { ActorType } from '$lib/util/constants';

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
  return {
    talent: JSON.parse(JSON.stringify(talent)),
    activeShow:
      talent.activeShows.length > 0
        ? JSON.parse(JSON.stringify(talent.activeShows[0]))
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
  create_show: async ({ request }) => {
    const data = await request.formData();
    const price = data.get('price') as string;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const numTickets = data.get('numTickets') as string;
    const talentId = data.get('talentId') as string;
    const agentId = data.get('agentId') as string;
    const coverImageUrl = data.get('coverImageUrl') as string;

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

    const talent = await Talent.findById(talentId)
      .orFail(() => {
        throw error(404, 'Talent not found');
      })
      .exec();

    const show = await Show.create({
      price: +price,
      name,
      duration: +duration,
      numTickets: +numTickets,
      talent: talentId,
      agent: agentId,
      coverImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: +numTickets,
        },
      },
    });

    talent.activeShows.push(show._id);
    await talent.save();

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
    let showCancelled = false;

    mongoose.connect(MONGO_DB_ENDPOINT);
    const talent = await Talent.findOne({ key }).orFail(() => {
      throw error(404, 'Talent not found');
    });

    const show = await Show.findById(showId)
      .orFail(() => {
        throw error(404, 'Show not found');
      })
      .exec();

    const showService = createShowMachineService(show, {
      // @ts-ignore
      saveStateCallback: async showState => show.saveState(showState),
      saveShowEventCallback: async ({ type, ticket, transaction }) =>
        // @ts-ignore
        show.createShowEvent({ type, ticket, transaction }),
    });

    const showState = showService.getSnapshot();

    const cancel = {
      cancelledAt: new Date(),
      cancelledInState: JSON.stringify(showState.value),
      reason: ShowCancelReason.TALENT_CANCELLED,
      canceller: ActorType.TALENT,
    } as ShowStateType['cancel'];

    if (showState.can({ type: 'REQUEST CANCELLATION', cancel, tickets: [] })) {
      showService.send({ type: 'REQUEST CANCELLATION', cancel, tickets: [] });
    }

    showCancelled = showService.getSnapshot().matches('cancelled');

    return {
      success: true,
      showCancelled,
    };
  },
};
