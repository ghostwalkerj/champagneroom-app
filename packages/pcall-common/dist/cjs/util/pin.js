"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPin = exports.createPinHash = void 0;
const crypto_1 = require("crypto");
const createPinHash = (id, pin) => {
    const input = `id:${id}-pin:${pin}`;
    return (0, crypto_1.createHash)("sha256").update(input).digest("base64");
};
exports.createPinHash = createPinHash;
const verifyPin = (id, pin, hash) => {
    return (0, exports.createPinHash)(id, pin) === hash;
};
exports.verifyPin = verifyPin;
