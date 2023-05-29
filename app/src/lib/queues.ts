import type { EntityType, RedisOptionsType } from '$lib/constants';
import type { Job } from 'bullmq';
import { Queue, Worker } from 'bullmq';

export const getQueue = (
  entityType: EntityType,
  redisOptions: RedisOptionsType
) => {
  return new Queue(entityType, redisOptions);
};

export const getWorker = (
  entityType: EntityType,
  redisOptions: RedisOptionsType
) => {
  return new Worker(
    entityType,
    async (job: Job) => {
      console.log('Show Worker: ', job.data);
    },
    { autorun: false, connection: redisOptions.connection }
  );
};
