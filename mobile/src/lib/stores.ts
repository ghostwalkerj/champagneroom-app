import { writable } from 'svelte/store';
import type { TalentDocument } from '$lib/ORM/models/talent';
import type { TalentDBType } from '$lib/ORM/dbs/talentDB';
export const talent = writable<TalentDocument | null>(null);
export const talentDB = writable<TalentDBType | null>(null);