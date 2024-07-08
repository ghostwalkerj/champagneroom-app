import { error, type RequestHandler } from '@sveltejs/kit';
import type IORedis from 'ioredis';

import { EntityType } from '$lib/constants';
import {
  getShowPermissionsFromShowId,
  getTicketPermissionsFromTicketId
} from '$lib/server/machinesUtil';

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

  switch (type) {
    case EntityType.SHOW: {
      const showPermissions = await getShowPermissionsFromShowId({
        showId: id,
        redisConnection
      });
      return new Response(JSON.stringify(showPermissions));
    }
    case EntityType.TICKET: {
      const tp = await getTicketPermissionsFromTicketId({
        ticketId: id,
        redisConnection
      });
      return new Response(JSON.stringify(tp));
    }
  }

  return error(500, 'Not implemented');
}) satisfies RequestHandler;
