import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';

import type { LinkDocumentType } from 'db/models/link';

import urlJoin from 'url-join';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type getLinkQueryByAddressResponse = {
	linkDocument: LinkDocumentType;
};

export type linkQueryResult = UseQueryStoreResult<
	getLinkQueryByAddressResponse,
	AxiosError<unknown, any>,
	getLinkQueryByAddressResponse,
	QueryKey
>;

export const getLinkQueryByAddress = (address: string) => {
	const linkQuery = useQuery<getLinkQueryByAddressResponse, AxiosError>(
		['linkDocument', address],
		async () => {
			const url = new URL(urlJoin(API_URL, 'link/byAddress', address));
			const { data } = await axios.get<getLinkQueryByAddressResponse>(url.toString());
			return data;
		}
	);
	return linkQuery;
};
