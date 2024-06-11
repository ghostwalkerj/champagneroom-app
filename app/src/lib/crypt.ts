import crypto from 'node:crypto';

export const authDecrypt = (text: string | undefined, authSalt: string) => {
  if (!text) {
    return;
  }
  try {
    const textParts = text.split(':');
    const shifted = textParts.shift();
    const iv = shifted && (Buffer.from(shifted, 'hex') as Buffer);

    if (!iv) {
      return;
    }

    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto
      .createHash('sha256')
      .update(authSalt)
      .digest('base64')
      .slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    const decrypted = decipher.update(encryptedData);
    const decryptedText = Buffer.concat([decrypted, decipher.final()]);
    return decryptedText.toString();
  } catch (error) {
    console.error(error);
  }
};

export const authEncrypt = (text: string | undefined, authSalt: string) => {
  if (!text) {
    return;
  }
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto
      .createHash('sha256')
      .update(authSalt)
      .digest('base64')
      .slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error(error);
  }
};
