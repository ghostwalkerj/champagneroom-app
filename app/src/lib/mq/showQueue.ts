import { EntityType } from '$lib/util/constants';
import { REDIS_OPTIONS } from '$lib/util/secrets';
import type { Job } from 'bullmq';
import { Queue, Worker } from 'bullmq';

export const queue = new Queue(EntityType.SHOW, REDIS_OPTIONS);
export const worker = new Worker(
  EntityType.SHOW,
  async (job: Job) => {
    console.log('Show Worker: ', job.data);
  },
  { autorun: false, connection: REDIS_OPTIONS.connection }
);
