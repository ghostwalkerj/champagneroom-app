"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var api_1 = require("@bull-board/api");
var bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
var express_1 = require("@bull-board/express");
var build_number_generator_1 = require("build-number-generator");
var bullmq_1 = require("bullmq");
var express_2 = require("express");
var express_basic_auth_1 = require("express-basic-auth");
var ioredis_1 = require("ioredis");
var max_listeners_exceeded_warning_1 = require("max-listeners-exceeded-warning");
var mongoose_1 = require("mongoose");
var tiny_parse_argv_1 = require("tiny-parse-argv");
var handler_1 = require("./build/handler");
var constants_1 = require("./dist/constants");
var payout_1 = require("./dist/payout");
var invoiceWorker_1 = require("./dist/workers/invoiceWorker");
var payoutWorker_1 = require("./dist/workers/payoutWorker");
var showWorker_1 = require("./dist/workers/showWorker");
var package_json_1 = require("./package.json");
var buildNumber = (0, build_number_generator_1.generate)(package_json_1.default.version);
var buildTime = (0, build_number_generator_1.format)(buildNumber);
var bullMQPath = process.env.BULLMQ_ADMIN_PATH || '/admin/queues';
var startWorker = (0, tiny_parse_argv_1.default)(process.argv).worker || false;
var app = (0, express_2.default)();
var mongoDBEndpoint = process.env.MONGO_DB_ENDPOINT;
if (!mongoDBEndpoint) {
    throw new Error('No MongoDB endpoint provided');
}
var redisOptions = {
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
var connection = new ioredis_1.default(redisOptions.connection);
var showQueue = new bullmq_1.Queue(constants_1.EntityType.SHOW, { connection: connection });
var invoiceQueue = new bullmq_1.Queue(constants_1.EntityType.INVOICE, {
    connection: connection
});
var payoutQueue = new bullmq_1.Queue(constants_1.EntityType.PAYOUT, {
    connection: connection
});
var paymentAuthToken = await (0, payout_1.createBitcartToken)(process.env.BITCART_EMAIL || '', process.env.BITCART_PASSWORD || '', process.env.BITCART_API_URL || '');
// Workers
if (startWorker) {
    var showWorker = (0, showWorker_1.getShowWorker)({
        // @ts-ignore
        showQueue: showQueue,
        // @ts-ignore
        payoutQueue: payoutQueue,
        redisConnection: connection,
        paymentAuthToken: paymentAuthToken
    });
    showWorker.run();
    var invoiceWorker = (0, invoiceWorker_1.getInvoiceWorker)({
        redisConnection: connection,
        paymentAuthToken: paymentAuthToken
    });
    invoiceWorker.run();
    var payoutWorker = (0, payoutWorker_1.getPayoutWorker)({
        // @ts-ignore
        payoutQueue: payoutQueue,
        redisConnection: connection,
        paymentAuthToken: paymentAuthToken
    });
    payoutWorker.run();
}
// Bull Dashboard
var serverAdapter = new express_1.ExpressAdapter();
serverAdapter.setBasePath(bullMQPath);
(0, api_1.createBullBoard)({
    queues: [
        new bullMQAdapter_1.BullMQAdapter(showQueue),
        new bullMQAdapter_1.BullMQAdapter(invoiceQueue),
        new bullMQAdapter_1.BullMQAdapter(payoutQueue)
    ],
    serverAdapter: serverAdapter
});
var staticAuth = (0, express_basic_auth_1.default)({
    users: {
        admin: process.env.BULLMQ_ADMIN_PASSWORD || ''
    },
    challenge: true
});
app.get(bullMQPath, staticAuth);
app.use(bullMQPath, serverAdapter.getRouter());
// health check
// eslint-disable-next-line unicorn/prevent-abbreviations
app.get('/health', function (_, res) {
    res.send('OK');
});
var port = process.env.PORT || 3000;
(0, max_listeners_exceeded_warning_1.default)();
var formatMemoryUsage = function (data) {
    return "".concat(Math.round((data / 1024 / 1024) * 100) / 100, " MB");
};
function logMemoryUsage() {
    var memoryData = process.memoryUsage();
    process.stdout.write("\rMemory usage: rss: ".concat(formatMemoryUsage(memoryData.rss), ", heapTotal: ").concat(formatMemoryUsage(memoryData.heapTotal), ", heapUsed: ").concat(formatMemoryUsage(memoryData.heapUsed), ", external: ").concat(formatMemoryUsage(memoryData.external)));
}
// eslint-disable-next-line unicorn/prefer-top-level-await
mongoose_1.default.connect(mongoDBEndpoint);
mongoose_1.default.connection.on('connected', function () {
    console.log('Mongoose connected:', mongoose_1.default.connection.name);
    //setup({
    defaultToMongooseSchemaOptions: {
        unknownKeys: 'strip';
    }
    //});
    mongoose_1.default.set('strictQuery', true);
    // Svelte App
    app.use(handler_1.handler);
    app.listen(port, function () {
        console.log('Champagne Server running on:', port);
        console.log('Workers running:', startWorker);
        console.log('Build number:', buildNumber);
        console.log('Build time:', buildTime);
        logMemoryUsage();
        setInterval(logMemoryUsage, 50000);
    });
});
