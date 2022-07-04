import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';

import type { LinkDocument } from 'db/models/link';
import { BASE_PCALL_URL, PCALL_API_URL } from 'lib/constants';

import urlJoin from 'url-join';

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
			const url = new URL(urlJoin(PCALL_API_URL, 'link/byCreatorId', creatorId));
			const { data } = await axios.get<getLinkQueryByCreatorIdResponse>(url.toString());
			return data;
		}
	);
	return linkQuery;
};
