import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { handler } from './build/handler.js';
import { EntityType } from './dist/util/constants.js';

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
const redisOptions = {
  connection: {
    host: process.env.REDIS_HOST,
    port: +(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    enableReadyCheck: false,
  },
};

const showQueue = new Queue(EntityType.SHOW, redisOptions ); 

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(showQueue)],
  serverAdapter: serverAdapter,
});

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

// let SvelteKit handle everything else, including serving prerendered pages and static assets

app.use(cors(corsOptions), handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('pCall server on: ', port);
});
