"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const { Worker, isMainThread } = require("worker_threads");
async function run() {
    let type = "";
    const workerPath = "./worker.js";
    // require and __dirname are not supported in ESM
    // see: https://nodejs.org/api/esm.html#differences-between-es-modules-and-commonjs
    if (typeof require !== "undefined" && typeof __dirname !== "undefined") {
        type = "CJS";
        if (isMainThread) {
            const worker = new Worker(__dirname + "/" + workerPath);
            worker.on("exit", (code) => {
                console.log(`Nodejs worker finished with code ${code}`);
            });
        }
    }
    else {
        type = "ESM";
        if (typeof Worker !== "undefined") {
            new Worker(workerPath);
        }
        else {
            console.log("Sorry, your runtime does not support Web Workers");
            await (_a = workerPath, Promise.resolve().then(() => __importStar(require(_a))));
        }
    }
    console.log(`Completed ${type} build run.`);
}
exports.run = run;
