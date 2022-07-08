import urlJoin from 'url-join';

const PORT = import.meta.env.VITE_PCALL_PORT;
export const BASE_PCALL_URL = PORT
	? `${import.meta.env.VITE_PCALL_PROTOCOL}:${import.meta.env.VITE_PCALL_HOST}:${
			import.meta.env.VITE_PCALL_PORT
	  }`
	: `${import.meta.env.VITE_PCALL_PROTOCOL}:${import.meta.env.VITE_PCALL_HOST}`;
export const PCALL_API_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_API_PATH);
export const PCALL_ROOM_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_ROOM_PATH);
export const PCALL_TALENT_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_TALENT_PATH);
export const PCALL_AGENT_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_AGENT_PATH);
export const DEFAULT_PROFILE_IMAGE = import.meta.env.VITE_DEFAULT_PROFILE_IMAGE;

export const GUNDB_PEER = import.meta.env.VITE_GUNDB_PEER;
