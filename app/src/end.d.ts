/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PCALL_PROTOCOL: string;

	readonly VITE_PCALL_HOST: string;

	readonly VITE_PCALL_PORT: string;

	readonly VITE_ROOM_PATH: string;

	readonly VITE_REMOTE_COUCHDB_URL: string;

	readonly VITE_LOCAL_COUCHDB_URL: string;

	readonly VITE_API_PATH: string;
	readonly VITE_SIGNAL_SERVER_HOST: string;
	readonly VITE_SIGNAL_SERVER_PORT: number;
	readonly VITE_CALL_TIMEOUT: number;
	readonly VITE_INFURA_ID: string;

	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
