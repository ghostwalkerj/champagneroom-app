import { writable } from 'svelte/store';
import type { TalentDocument } from 'pcall/src/lib/ORM/models/talent';

export const talent = writable<TalentDocument | null>(null);