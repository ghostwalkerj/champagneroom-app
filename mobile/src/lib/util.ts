import urlJoin from 'url-join';
import { TokenRoles } from '$lib/util/constants';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageTypes } from '$lib/ORM/rxdb';

export const getTalentDB = async (key: string) => {
	const PCALL_URL = import.meta.env.VITE_PCALL_URL;
	const AUTH_PATH = import.meta.env.VITE_AUTH_PATH;
	const auth_url = urlJoin(PCALL_URL, AUTH_PATH);

	try {
		const res = await fetch(auth_url, {
			method: 'POST',
			body: JSON.stringify({
				tokenRole: TokenRoles.TALENT
			})
		});
		const body = await res.json();
		const token = body.token as string;
		const db = await talentDB(token, key, StorageTypes.IDB);
		return db;
	} catch (e) {
		console.log(e);
	}
};
