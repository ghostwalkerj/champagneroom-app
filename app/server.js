import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import cors from 'cors';
import express from 'express';
import { handler } from './build/handler';
import { queue, worker } from './dist/mq/showQueue';
const app = express();
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

// Workers
worker.run();

// Bull Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Svelte App
app.use(cors(corsOptions), handler);
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('pCall server running on: ', port);
});
