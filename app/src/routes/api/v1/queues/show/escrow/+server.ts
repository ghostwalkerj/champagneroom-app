import { MONGO_DB_ENDPOINT } from '$env/static/private';
import type { ShowStateType } from '$lib/machines/showMachine';
import { createShowMachineService } from '$lib/machines/showMachine';
import { Show } from '$lib/models/show';
import { ActorType } from '$lib/util/constants';
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

export const _escrowQueue = Queue(
  'api/v1/queues/show/escrow', // 👈 the route it's reachable on
  async (job: string) => {
    const { showService } = await getShow(job);
    const showState = showService.getSnapshot();
    if (showState.matches('inEscrow')) {
      const finalize = {
        finalizedAt: new Date(),
        finalizer: ActorType.TIMER,
      } as ShowStateType['finalize'];
      showService.send({ type: 'SHOW FINALIZED', finalize });
    }
  }
);

export const POST = _escrowQueue;

export const prerender = false;
