import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { Talent } from '$lib/ORM/models/talent';
import { fail } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import mongoose from 'mongoose';
import type { Actions, PageServerLoad } from './$types';

const getTalent = async (key: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const talent = await Talent.findOne().where({ key }).exec();
  if (!talent) {
    throw error(404, 'Talent not found');
  }
  return talent;
};

export const load: PageServerLoad = async ({ params }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const talent = await getTalent(key);
  const currentShow = await talent.populate('currentShow');

  return {
    talent: JSON.parse(JSON.stringify(talent)),
    currentShow: currentShow ? JSON.parse(JSON.stringify(currentShow)) : null,
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
    const talent = await getTalent(key);
    talent.profileImageUrl = url;
    talent.save();

    return { success: true, talent: JSON.parse(JSON.stringify(talent)) };
  },
};
