import urlJoin from 'url-join';

const PORT = import.meta.env.VITE_PCALL_PORT;
export const BASE_PCALL_URL = PORT
	? `${import.meta.env.VITE_PCALL_PROTOCOL}:${import.meta.env.VITE_PCALL_HOST}:${
			import.meta.env.VITE_PCALL_PORT
	  }`
	: `${import.meta.env.VITE_PCALL_PROTOCOL}:${import.meta.env.VITE_PCALL_HOST}`;
export const PCALL_ROOM_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_ROOM_PATH);
export const PCALL_TALENT_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_TALENT_PATH);
export const PCALL_AGENT_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_AGENT_PATH);
export const DEFAULT_PROFILE_IMAGE = import.meta.env.VITE_DEFAULT_PROFILE_IMAGE;
export const GUNDB_PEER = import.meta.env.VITE_GUNDB_PEER;
export const PCALL_MOBILE_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_MOBILE_PATH);
export const PCALL_MOBILE_ROOM_URL = urlJoin(PCALL_MOBILE_URL, import.meta.env.VITE_ROOM_PATH);
export const PCALL_MOBILE_TALENT_URL = urlJoin(PCALL_MOBILE_URL, import.meta.env.VITE_AGENT_PATH);
export const RXDB_PASSWORD = import.meta.env.VITE_RXDB_PASSWORD;
export const API_PATH = import.meta.env.VITE_API_PATH;
export const AUTH_PATH = import.meta.env.VITE_AUTH_PATH;

export const AUTH_URL = urlJoin(BASE_PCALL_URL, AUTH_PATH);
export const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;
export const JWT_AUDIENCE = import.meta.env.VITE_JWT_AUDIENCE;
export const CREATORS_ENDPOINT = import.meta.env.VITE_CREATORS_ENDPOINT;
export const JWT_EXPIRY = Number.parseInt(import.meta.env.VITE_JWT_EXPIRY || '600', 10);
export const JWT_CREATOR_USER = import.meta.env.VITE_JWT_CREATOR_USER;
export const JWT_PUBLIC_USER = import.meta.env.VITE_JWT_PUBLIC_USER;

export const PUBLIC_ENDPOINT = import.meta.env.VITE_PUBLIC_ENDPOINT;
