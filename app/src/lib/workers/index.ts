import type { RedisOptionsType } from '$lib/constants';
import { EntityType } from '$lib/constants';
import { Queue } from 'bullmq';
import { getShowWorker } from './show/showWorker';

export const getQueue = (
  entityType: EntityType,
  redisOptions: RedisOptionsType
) => {
  return new Queue(entityType, redisOptions);
};

export const getWorker = (
  entityType: EntityType,
  redisOptions: RedisOptionsType,
  mongoDBEndpoint: string
) => {
  switch (entityType) {
    case EntityType.SHOW:
      return getShowWorker(redisOptions, mongoDBEndpoint);
    default:
      return getShowWorker(redisOptions, mongoDBEndpoint);
  }
};
