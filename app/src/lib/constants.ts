import urlJoin from 'url-join';

export const BASE_PCALL_URL = `${import.meta.env.VITE_PCALL_PROTOCOL}:${
	import.meta.env.VITE_PCALL_HOST
}:${import.meta.env.VITE_PCALL_PORT}`;

export const PCALL_API_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_API_PATH);

export const PCALL_ROOM_URL = urlJoin(BASE_PCALL_URL, import.meta.env.VITE_ROOM_PATH);
