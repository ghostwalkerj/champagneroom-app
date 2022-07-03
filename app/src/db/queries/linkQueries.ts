import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';

import type { LinkDocument } from 'db/models/link';

import urlJoin from 'url-join';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type getLinkQueryByCreatorIdResponse = {
	linkDocument: LinkDocument;
};

export type linkQueryResult = UseQueryStoreResult<
	getLinkQueryByCreatorIdResponse,
	AxiosError<unknown, unknown>,
	getLinkQueryByCreatorIdResponse,
	QueryKey
>;

export const getLinkQueryByCreatorId = (creatorId: string) => {
	const linkQuery = useQuery<getLinkQueryByCreatorIdResponse, AxiosError>(
		['linkDocument', creatorId],
		async () => {
			const url = new URL(urlJoin(API_URL, 'link/byCreatorId', creatorId));
			const { data } = await axios.get<getLinkQueryByCreatorIdResponse>(url.toString());
			return data;
		}
	);
	return linkQuery;
};
