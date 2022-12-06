import type { TalentDBType } from '$lib/ORM/dbs/talentDB';
import type { TalentDocument } from '$lib/ORM/models/talent';
import type { LinkDocument } from '$lib/ORM/models/link';
import { writable } from 'svelte/store';
export const talent = writable<TalentDocument | null>(null);
export const talentDB = writable<TalentDBType | null>(null);
export const currentLink = writable<LinkDocument | null>(null);