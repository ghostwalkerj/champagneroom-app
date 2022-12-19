import type { ShowMachineServiceType, ShowMachineStateType } from '$lib/machines/showMachine';
import type { TalentDBType } from '$lib/ORM/dbs/talentDB';
import type { TalentDocument } from '$lib/ORM/models/talent';
import type { ShowDocument } from '$lib/ORM/models/show';
import { writable } from 'svelte/store';
export const talent = writable<TalentDocument | null>(null);
export const talentDB = writable<TalentDBType | null>(null);
export const currentShow = writable<ShowDocument | null>(null);

export const showMachineState = writable<ShowMachineStateType | null>(null);
export const showMachineService = writable<ShowMachineServiceType | null>(null);
