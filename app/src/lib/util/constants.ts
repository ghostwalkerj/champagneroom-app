export const DEFAULT_PROFILE_IMAGE = import.meta.env.VITE_DEFAULT_PROFILE_IMAGE;
export const RXDB_PASSWORD = import.meta.env.VITE_RXDB_PASSWORD;
export const API_PATH = import.meta.env.VITE_API_PATH;
export const AUTH_PATH = import.meta.env.VITE_AUTH_PATH;
export const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;
export const JWT_AUDIENCE = import.meta.env.VITE_JWT_AUDIENCE;
export const CREATORS_ENDPOINT = import.meta.env.VITE_CREATORS_ENDPOINT;
export const JWT_EXPIRY = Number.parseInt(import.meta.env.VITE_JWT_EXPIRY || '600', 10);
export const JWT_CREATOR_USER = import.meta.env.VITE_JWT_CREATOR_USER;
export const JWT_PUBLIC_USER = import.meta.env.VITE_JWT_PUBLIC_USER;
export const PUBLIC_ENDPOINT = import.meta.env.VITE_PUBLIC_ENDPOINT;
export const TALENT_PATH = import.meta.env.VITE_TALENT_PATH;
export const ROOM_PATH = import.meta.env.VITE_ROOM_PATH;
export const AGENT_PATH = import.meta.env.VITE_AGENT_PATH;
export const MOBILE_PATH = import.meta.env.VITE_MOBILE_PATH;

export const IMAGE_UPLOAD_PATH = import.meta.env.VITE_IMAGE_UPLOAD_PATH;

export enum TokenRoles {
	ADMIN,
	PUBLIC,
	AGENT,
	TALENT
}

export const INFURA_IPFS_PROJECT_ID = import.meta.env.VITE_INFURA_IPFS_PROJECT_ID;

export const INFURA_IPFS_PROJECT_SECRET = import.meta.env.VITE_INFURA_IPFS_PROJECT_SECRET;

export const INFURA_IPFS_API_URL = import.meta.env.VITE_INFURA_IPFS_API_URL;
export const INFURA_IPFS_API_PORT = import.meta.env.VITE_INFURA_IPFS_API_PORT;

export const INFURA_IPFS_DEDICATED_GATEWAY = import.meta.env.VITE_INFURA_IPFS_DEDICATED_GATEWAY;

export const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

export const DOCKERIZED = import.meta.env.VITE_DOCKERIZED === 'true';
