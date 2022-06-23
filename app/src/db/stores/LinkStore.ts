import type { LinkType } from 'db/models/Link';
import { selectedAccount } from 'svelte-web3';
import { writable, type Subscriber } from 'svelte/store';
import urlJoin from 'url-join';
const API_PATH = import.meta.env.VITE_API_URL;

const getLinkByAddress = async (address: string): Promise<LinkType> => {
	let link = {} as LinkType;
	if (address) {
		const url = new URL(urlJoin(API_PATH, 'link/byAddress', address));

		const response = await fetch(url);
		const body = await response.json();

		if (body.success) {
			link = body.linkDocument;
		}
	}
	return link;
};

async function storeFunc() {
	const { subscribe: _subscribe, set: _set } = writable<LinkType>();
	const _unsubscribe = selectedAccount.subscribe((account) => {
		if (account) {
			getLinkByAddress(account).then((linkDocument) => {
				_set(linkDocument);
			});
		}
	});
	const subscribe = (subscriber: Subscriber<LinkType>) => {
		const unsubscribe = _subscribe(subscriber);
		return () => {
			unsubscribe();
			_unsubscribe();
		};
	};
	const set = (linkDocument: LinkType) => {
		_set(linkDocument);
	};

	return { subscribe, set };
}

export const linkStore = await storeFunc();
