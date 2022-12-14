import type { LinkMachineStateType } from '$lib/machines/linkMachine';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageTypes } from '$lib/ORM/rxdb';
import { TokenRoles } from '$lib/util/constants';
import urlJoin from 'url-join';

export const getTalentDB = async (key: string) => {
	const PCALL_URL = import.meta.env.VITE_PCALL_URL;
	const AUTH_PATH = import.meta.env.VITE_AUTH_PATH;
	const auth_url = urlJoin(PCALL_URL, AUTH_PATH);

	const res = await fetch(auth_url, {
		method: 'POST',
		body: JSON.stringify({
			tokenRole: TokenRoles.TALENT
		}),
	});
	const body = await res.json();
	const token = body.token as string;
	const db = await talentDB(token, key, StorageTypes.IDB);
	return db;
};

export const formatLinkState = (linkMachineState: LinkMachineStateType) => {
	if (linkMachineState.matches('finalized')) return 'finalized';
	if (linkMachineState.matches('unclaimed')) return 'unclaimed';
	if (linkMachineState.matches('cancelled')) return 'cancelled';
	if (linkMachineState.matches('finalized')) return 'finalized';
	if (linkMachineState.matches('inEscrow')) return 'in escrow';
	if (linkMachineState.matches('inDispute')) return 'in dispute';
	if (linkMachineState.matches('claimed.waiting4Funding')) return 'waiting for funding';
	if (linkMachineState.matches('claimed.canCall')) return 'ready for pCall';
	if (linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')) return 'waiting for refund';

};

export const loadExternalScript = (src: string) => {
	let resolveLoadScriptPromise: (arg0: boolean) => any;

	const loadScriptPromise: Promise<boolean> = new Promise((resolve): void => {
		resolveLoadScriptPromise = resolve;
	});

	const script = document.createElement('script');
	script.src = src;
	script.async = true;
	script.onload = () => resolveLoadScriptPromise(true);
	document.body.appendChild(script);

	return loadScriptPromise;
};