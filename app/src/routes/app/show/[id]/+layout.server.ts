import { error } from '@sveltejs/kit';

import { Show } from '$lib/models/show';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends, params }) => {
  depends('app:show');
  const showId = params.id;
  if (showId === null) {
    throw error(404, 'Champagne Show not found');
  }

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  return {
    show: show.toJSON({ flattenMaps: true, flattenObjectIds: true })
  };
};
