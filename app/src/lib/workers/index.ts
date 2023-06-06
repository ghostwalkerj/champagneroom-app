import { EntityType } from '$lib/constants';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { getShowWorker } from './showWorker';

export const getQueue = (entityType: EntityType, connection: IORedis) => {
  return new Queue(entityType, { connection });
};

export const getWorker = (
  entityType: EntityType,
  connection: IORedis,
  mongoDBEndpoint: string
) => {
  switch (entityType) {
    case EntityType.SHOW: {
      return getShowWorker(connection, mongoDBEndpoint);
    }
    default: {
      return getShowWorker(connection, mongoDBEndpoint);
    }
  }
};
