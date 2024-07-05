import { error, type RequestHandler } from '@sveltejs/kit';
import type IORedis from 'ioredis';
import mongoose from 'mongoose';

import { Show, type ShowDocument } from '$lib/models/show';

import { EntityType } from '$lib/constants';
import { getShowPermissionsFromShow } from '$lib/server/machinesUtil';

export const GET = (async ({ params, url, locals }) => {
  const id = params.id;
  const redisConnection = locals.redisConnection as IORedis;
  if (id === null || redisConnection === null) {
    console.error('Bad Request', { id, redisConnection });
    error(400, 'Bad Request');
  }
  const type = url.searchParams.get('type') as EntityType;
  if (type === null) {
    console.error('Bad Request', { type });
    error(400, 'Bad Request');
  }
  const objectId = new mongoose.Types.ObjectId(id);

  switch (type) {
    case EntityType.SHOW: {
      // const show = (await Show.findById(objectId).orFail(
      //   error(500, 'Show not found')
      // )) as ShowDocument;

      const show = (await Show.findById(objectId)) as ShowDocument;

      if (show === null) {
        return error(500, 'Show not found');
      }
      const showPermissions = getShowPermissionsFromShow({
        show,
        redisConnection
      });
      return new Response(JSON.stringify(showPermissions));
    }
  }

  return error(500, 'Not implemented');
}) satisfies RequestHandler;
