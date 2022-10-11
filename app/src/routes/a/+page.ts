import { PUBLIC_AUTH_PATH } from '$env/static/public';
import { TokenRoles } from '$lib/util/constants';

import urlJoin from 'url-join';
import type { PageLoad } from './$types';

//TODO: Only return token if agent address is good.  How?
export const load: PageLoad = async ({ url, fetch }) => {
	const auth_url = urlJoin(url.origin, PUBLIC_AUTH_PATH);
	try {
		const res = await fetch(auth_url, {
			method: 'POST',
			body: JSON.stringify({
				tokenRole: TokenRoles.AGENT
			})
		});
		const body = await res.json();
		const token = body.token as string;
		return { token };
	} catch (e) {
		console.log(e);
	}
};
