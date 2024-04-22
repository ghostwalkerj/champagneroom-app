import 'dotenv/config';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { format, generate } from 'build-number-generator';
import { Queue } from 'bullmq';
import express from 'express';
import basicAuth from 'express-basic-auth';
import IORedis from 'ioredis';
import maxListenersExceededWarning from 'max-listeners-exceeded-warning';
import mongoose from 'mongoose';
import parseArgv from 'tiny-parse-argv';

import { handler } from './build/handler';
import { EntityType } from './dist/constants';
import { createBitcartToken } from './dist/payout';
import { getInvoiceWorker } from './dist/workers/invoiceWorker';
import { getPayoutWorker } from './dist/workers/payoutWorker';
import { getShowWorker } from './dist/workers/showWorker';
import packageFile from './package.json' assert { type: 'json' };

const buildNumber = generate(packageFile.version);
const buildTime = format(buildNumber);
const bullMQPath = process.env.BULLMQ_ADMIN_PATH || '/admin/queues';

const startWorker = parseArgv(process.argv).worker || false;
const app = express();

const mongoDBEndpoint = process.env.MONGO_DB_ENDPOINT;
if (!mongoDBEndpoint) {
  throw new Error('No MongoDB endpoint provided');
}

const redisOptions = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: +(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || '',
    username: process.env.REDIS_USERNAME || '',
    enableReadyCheck: false,
    // eslint-disable-next-line unicorn/no-null
    maxRetriesPerRequest: null
  }
};

const connection = new IORedis(redisOptions.connection);

const showQueue = new Queue(EntityType.SHOW, { connection });
const invoiceQueue = new Queue(EntityType.INVOICE, {
  connection
});
const payoutQueue = new Queue(EntityType.PAYOUT, {
  connection
});

const paymentAuthToken = await createBitcartToken(
  process.env.BITCART_EMAIL || '',
  process.env.BITCART_PASSWORD || '',
  process.env.BITCART_API_URL || ''
);

// Workers
if (startWorker) {
  const showWorker = getShowWorker({
    // @ts-ignore
    showQueue,
    // @ts-ignore
    payoutQueue,
    redisConnection: connection,
    paymentAuthToken
  });
  showWorker.run();

  const invoiceWorker = getInvoiceWorker({
    redisConnection: connection,
    paymentAuthToken
  });
  invoiceWorker.run();

  const payoutWorker = getPayoutWorker({
    // @ts-ignore
    payoutQueue,
    redisConnection: connection,
    paymentAuthToken
  });
  payoutWorker.run();
}

// Bull Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(bullMQPath);
createBullBoard({
  queues: [
    new BullMQAdapter(showQueue),
    new BullMQAdapter(invoiceQueue),
    new BullMQAdapter(payoutQueue)
  ],
  serverAdapter: serverAdapter
});
const staticAuth = basicAuth({
  users: {
    admin: process.env.BULLMQ_ADMIN_PASSWORD || ''
  },
  challenge: true
});

app.get(bullMQPath, staticAuth);
app.use(bullMQPath, serverAdapter.getRouter());

// health check
// eslint-disable-next-line unicorn/prevent-abbreviations
app.get('/health', (_, res) => {
  res.send('OK');
});

const port = process.env.PORT || 3000;

maxListenersExceededWarning();

const formatMemoryUsage = (data: number) =>
  `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;

function logMemoryUsage() {
  const memoryData = process.memoryUsage();
  console.log(
    `Memory usage: rss: ${formatMemoryUsage(
      memoryData.rss
    )}, heapTotal: ${formatMemoryUsage(
      memoryData.heapTotal
    )}, heapUsed: ${formatMemoryUsage(
      memoryData.heapUsed
    )}, external: ${formatMemoryUsage(memoryData.external)}`
  );
}

// eslint-disable-next-line unicorn/prefer-top-level-await
mongoose.connect(mongoDBEndpoint);
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected:', mongoose.connection.name);
  //setup({
  defaultToMongooseSchemaOptions: {
    unknownKeys: 'strip';
  }
  //});
  mongoose.set('strictQuery', true);

  // Svelte App
  app.use(handler);

  app.listen(port, () => {
    console.log('Champagne Server running on:', port);
    console.log('Workers running:', startWorker);
    console.log('Build number:', buildNumber);
    console.log('Build time:', buildTime);
    logMemoryUsage();
    setInterval(logMemoryUsage, 50_000);
  });
});
