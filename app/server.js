import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { handler } from './build/handler';
import { EntityType } from './dist/constants';
import { getQueue, getWorker } from './dist/workers';

const app = express();
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

const redisOptions = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || '',
    username: process.env.REDIS_USERNAME || '',
    enableReadyCheck: false,
  }
}; 

// Workers
const showWorker = getWorker(EntityType.SHOW, redisOptions);
showWorker.run();

// Bull Dashboard
const queue = getQueue(EntityType.SHOW, redisOptions);
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
