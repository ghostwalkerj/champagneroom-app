import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Show, ShowStatus } from '$lib/models/show';
import { Talent } from '$lib/models/talent';
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
    .lean()
    .populate('activeShows')
    .exec();

  if (talent === null) {
    throw error(404, 'Talent not found');
  }
  return {
    talent: JSON.parse(JSON.stringify(talent)),
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

    const talent = await Talent.findById(talentId).exec();
    if (!talent) {
      throw error(404, 'Talent not found');
    }

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
    talent.save();

    return {
      success: true,
      showCreated: true,
      show: JSON.parse(JSON.stringify(show)),
    };
  },
};
