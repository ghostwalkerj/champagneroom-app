import crypto from 'crypto';

export const createPinHash = (id: string, pin: string) => {
  const input = `id:${id}-pin:${pin}`;
  return crypto.createHash('sha256').update(input).digest('base64');
};

export const verifyPin = (id: string, pin: string, hash: string) => {
  return createPinHash(id, pin) === hash;
};
