import { createHash } from "crypto";
export const createPinHash = (id, pin) => {
    const input = `id:${id}-pin:${pin}`;
    return createHash("sha256").update(input).digest("base64");
};
export const verifyPin = (id, pin, hash) => {
    return createPinHash(id, pin) === hash;
};
