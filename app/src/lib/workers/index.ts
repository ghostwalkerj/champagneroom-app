import { EntityType } from '$lib/constants';
import type { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { getShowWorker } from './showWorker';

export const getWorker = (
  entityType: EntityType,
  queue: Queue,
  redisConnection: IORedis
) => {
  switch (entityType) {
    case EntityType.SHOW: {
      return getShowWorker(queue, redisConnection);
    }
    default: {
      return getShowWorker(queue, redisConnection);
    }
  }
};
