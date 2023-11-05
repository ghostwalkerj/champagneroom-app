import { writable } from 'svelte/store';

export const browserType = writable();

export const nameStore = writable<string>('');
