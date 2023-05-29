import type { RedisOptionsType } from '$lib/constants';
import { EntityType } from '$lib/constants';
import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

export type ShowJobDataType = {
  showId: string;
  [key: string]: any;
};

export const getShowWorker = (redisOptions: RedisOptionsType) => {
  return new Worker(
    EntityType.SHOW,
    async (job: Job) => {
      console.log('Show Worker: ', job.data);
      switch (job.name) {
        case 'cancelShow':
          cancelShow(job.data);
      }
    },
    { autorun: false, connection: redisOptions.connection }
  );
};

const cancelShow = async (data: ShowJobDataType) => {
  const showId = data.showId;
};
