/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CALL_URL: string;
  readonly VITE_REMOTE_COUCHDB_URL: string;

  readonly VITE_LOCAL_COUCHDB_URL: string;

  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
