import { AUTH_PATH, TokenRoles } from '$lib/constants';
import urlJoin from 'url-join';

//TODO: Only return token if agent address is good.
export async function load({ url, fetch }) {
	const auth_url = urlJoin(url.origin, AUTH_PATH);
	try {
		const res = await fetch(auth_url, {
			method: 'POST',
			body: JSON.stringify({
				tokenRole: TokenRoles.AGENT
			})
		});
		const body = await res.json();
		const token = body.token;
		return { token };
	} catch (e) {
		console.log(e);
	}
}
