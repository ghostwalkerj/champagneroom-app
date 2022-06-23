import type { LinkDocument } from 'db/models/Link';
import { selectedAccount } from 'svelte-web3';
import { writable, type Subscriber } from 'svelte/store';
import urlJoin from 'url-join';
const API_PATH = import.meta.env.VITE_API_URL;

const getLinkByAddress = async (address: string): Promise<LinkDocument> => {
	let link = {} as LinkDocument;
	if (address) {
		const url = new URL(urlJoin(API_PATH, 'link/byAddress', address));

		console.log('getLinkByAddress: ', url.toString());
		const response = await fetch(url);
		const body = await response.json();

		if (body.success) {
			link = body.linkDocument;
		}
	}
	return link;
};

async function storeFunc() {
	const { subscribe: _subscribe, set: _set } = writable<LinkDocument>();
	const _unsubscribe = selectedAccount.subscribe((account) => {
		if (account) {
			getLinkByAddress(account).then((linkDocument) => {
				_set(linkDocument);
			});
		}
	});
	const subscribe = (subscriber: Subscriber<LinkDocument>) => {
		const unsubscribe = _subscribe(subscriber);
		return () => {
			unsubscribe();
			_unsubscribe();
		};
	};
	const set = (linkDocument: LinkDocument) => {
		_set(linkDocument);
	};

	return { subscribe, set };
}

export const linkStore = await storeFunc();
