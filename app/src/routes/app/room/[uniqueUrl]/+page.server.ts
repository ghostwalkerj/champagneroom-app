import { error } from '@sveltejs/kit';

import { Creator } from '$lib/models/creator';

import { Room } from '$lib/server/models/room';

import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
  const uniqueUrl = encodeURIComponent(params.uniqueUrl);
  const user = locals.user;

  const room = await Room.findOne({
    uniqueUrl: uniqueUrl
  })
    .orFail(() => {
      throw error(404, 'Room not found');
    })
    .exec();

  const creator = await Creator.findOne({
    room: room._id
  })
    .orFail(() => {
      throw error(404, 'Creator not found');
    })
    .exec();

  return {
    user: user
      ? user.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    room: room
      ? room.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    creator: creator
      ? creator.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined
  };
}) satisfies PageServerLoad;
