import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { format, generate } from 'build-number-generator';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import parseArgv from 'tiny-parse-argv';
import { handler } from './build/handler';
import { EntityType } from './dist/constants';
import { getWorker } from './dist/workers';
const buildNumber = generate('0.1');
const buildTime = format(buildNumber);
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';

const startWorker = parseArgv(process.argv).worker || false;
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
    maxRetriesPerRequest: null,
  },
};

const redisConnection = new IORedis(redisOptions.connection);

const mongoDBEndpoint =
  process.env.MONGO_DB_ENDPOINT || 'mongodb://localhost:27017';
mongoose.connect(mongoDBEndpoint);

const showQueue = new Queue(EntityType.SHOW, { connection: redisConnection });

// Workers
if (startWorker) {
  const showWorker = getWorker(EntityType.SHOW, showQueue, redisConnection);
  showWorker.run();
}

// Bull Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(showQueue)],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Svelte App
app.use(cors(corsOptions), handler);
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('pCall server running on:', port);
  console.log('Workers running:', startWorker);
  console.log('Build number:', buildNumber);
  console.log('Build time:', buildTime);
});
