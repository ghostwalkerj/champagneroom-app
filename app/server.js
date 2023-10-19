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
import { getShowWorker } from './dist/workers/showWorker';
import { getInvoiceWorker } from './dist/workers/invoiceWorker';
import { getPayoutWorker } from './dist/workers/payoutWorker';
import { createAuthToken } from './dist/util/payment';
import packageFile from './package.json' assert { type: 'json' };
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import basicAuth from 'express-basic-auth';

const buildNumber = generate(packageFile.version);
const buildTime = format(buildNumber);

const startWorker = parseArgv(process.argv).worker || false;
const app = express();
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

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

const redisConnection = new IORedis(redisOptions.connection);

const mongoDBEndpoint =
  process.env.MONGO_DB_ENDPOINT || 'mongodb://localhost:27017';
mongoose.connect(mongoDBEndpoint);

const showQueue = new Queue(EntityType.SHOW, { connection: redisConnection });
const invoiceQueue = new Queue(EntityType.INVOICE, {
  connection: redisConnection
});
const payoutQueue = new Queue(EntityType.PAYOUT, {
  connection: redisConnection
});

const paymentAuthToken = await createAuthToken(
  process.env.BITCART_EMAIL || '',
  process.env.BITCART_PASSWORD || '',
  process.env.PUBLIC_BITCART_API_URL || ''
);

// Workers
if (startWorker) {
  const showWorker = getShowWorker({
    // @ts-ignore
    showQueue,
    // @ts-ignore
    payoutQueue,
    redisConnection,
    paymentAuthToken,
    escrowPeriod: +(process.env.PUBLIC_ESCROW_PERIOD || 36_000_000),
    gracePeriod: +(process.env.PUBLIC_GRACE_PERIOD || 600_000)
  });
  showWorker.run();

  const invoiceWorker = getInvoiceWorker({ redisConnection, paymentAuthToken });
  invoiceWorker.run();

  const paymentWorker = getPayoutWorker({
    // @ts-ignore
    payoutQueue,
    redisConnection,
    paymentAuthToken,
    paymentPeriod:
      +(process.env.PUBLIC_PAYMENT_PERIOD || 6_000_000) / 60 / 1000,
    paymentNotificationUrl:
      process.env.PUBLIC_BITCART_PAYOUT_NOTIFICATION_PATH || '',
    bitcartStoreId: process.env.PUBLIC_BITCART_STORE_ID || ''
  });
  paymentWorker.run();
}

// Bull Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
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
    admin: 'Credibly-Displease5-Harddisk'
  },
  challenge: true
});

app.get('/admin/queues', staticAuth);
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
