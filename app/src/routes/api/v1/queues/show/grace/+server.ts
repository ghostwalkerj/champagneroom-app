import { MONGO_DB_ENDPOINT } from '$env/static/private';
import { createShowMachineService } from '$lib/machines/showMachine';
import { Show } from '$lib/models/show';
import { error } from '@sveltejs/kit';
import mongoose from 'mongoose';
import { Queue } from 'quirrel/sveltekit';

const getShow = async (showId: string) => {
  mongoose.connect(MONGO_DB_ENDPOINT);

  const show = await Show.findById(showId)
    .orFail(() => {
      throw error(404, 'Show not found');
    })
    .exec();

  const showService = createShowMachineService(show);

  return { show, showService };
};

export const _graceQueue = Queue(
  'api/v1/queues/show/grace', // 👈 the route it's reachable on
  async (job: string) => {
    const { showService } = await getShow(job);

    const showState = showService.getSnapshot();

    if (showState.matches('stopped')) {
      showService.send('SHOW ENDED');
    }
  }
);

export const POST = _graceQueue;

export const prerender = false;
