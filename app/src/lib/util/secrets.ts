import 'dotenv/config';

let MONGO_DB_FIELD_SECRET = process.env.MONGO_DB_FIELD_SECRET || 'secret';
let REDIS_OPTIONS = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    enableReadyCheck: false,
  },
};
let MONGO_DB_ENDPOINT = process.env.MONGO_DB_ENDPOINT || 'localhost';
let JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';
let JITSI_APP_ID = process.env.JITSI_APP_ID || '';
let JITSI_JWT_SECRET = process.env.JITSI_JWT_SECRET || '';
let WEB3STORAGE_API_TOKEN = process.env.WEB3STORAGE_API_TOKEN || '';
let WEB3STORAGE_DOMAIN = process.env.WEB3STORAGE_DOMAIN || 'w3s.link';

if (import.meta.env?.ssr) {
  MONGO_DB_FIELD_SECRET = import.meta.env.MONGO_DB_FIELD_SECRET || 'secret';
  REDIS_OPTIONS = {
    connection: {
      host: import.meta.env.REDIS_HOST,
      port: import.meta.env.REDIS_PORT,
      username: import.meta.env.REDIS_USERNAME,
      password: import.meta.env.REDIS_PASSWORD,
      enableReadyCheck: false,
    },
  };
  MONGO_DB_ENDPOINT = import.meta.env.MONGO_DB_ENDPOINT || 'localhost';
  JWT_EXPIRY = import.meta.env.JWT_EXPIRY || '1d';
  JITSI_APP_ID = import.meta.env.JITSI_APP_ID || '';
  JITSI_JWT_SECRET = import.meta.env.JITSI_JWT_SECRET || '';
  WEB3STORAGE_API_TOKEN = import.meta.env.WEB3STORAGE_API_TOKEN || '';
  WEB3STORAGE_DOMAIN = import.meta.env.WEB3STORAGE_DOMAIN || 'w3s.link';
}

export {
  MONGO_DB_FIELD_SECRET,
  REDIS_OPTIONS,
  MONGO_DB_ENDPOINT,
  JWT_EXPIRY,
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  WEB3STORAGE_API_TOKEN,
  WEB3STORAGE_DOMAIN,
};
