import { Queue } from 'quirrel/sveltekit';

const escrowQueue = Queue(
  'api/v1/queues/show/escrow', // 👈 the route it's reachable on
  async (job, meta) => {
    console.log('job', job);
    console.log('meta', meta);
  }
);

export const POST = escrowQueue;

export default escrowQueue;
