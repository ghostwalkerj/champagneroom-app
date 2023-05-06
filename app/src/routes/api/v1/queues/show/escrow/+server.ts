import { Queue } from 'quirrel/sveltekit';

export const _escrowQueue = Queue(
  'api/v1/queues/show/escrow', // 👈 the route it's reachable on
  async (job, meta) => {
    console.log('job', job);
    console.log('meta', meta);
  }
);

export const POST = _escrowQueue;

export const prerender = false;
