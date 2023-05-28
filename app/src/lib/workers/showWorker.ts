import { EntityType } from '$lib/util/constants.js';
import { REDIS_OPTIONS } from '$lib/util/secrets.js';
import { Queue } from 'bullmq';

export const showQueue = new Queue(EntityType.SHOW, REDIS_OPTIONS);
