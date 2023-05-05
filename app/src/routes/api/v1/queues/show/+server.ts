import { Queue } from 'quirrel/sveltekit';

const showQueue = Queue(
  'api/v1/queues/show', // 👈 the route it's reachable on
  async (job, meta) => {
    console.log('job', job);
    console.log('meta', meta);
  }
);

export const POST = showQueue;

export default showQueue;
