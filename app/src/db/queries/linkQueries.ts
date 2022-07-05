import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';

import type { LinkDocument } from 'db/models/link';
import { PCALL_API_URL } from 'lib/constants';

import urlJoin from 'url-join';

export type getLinkQueryByTalentIdResponse = {
	linkDocument: LinkDocument;
};

export type linkQueryResult = UseQueryStoreResult<
	getLinkQueryByTalentIdResponse,
	AxiosError<unknown, unknown>,
	getLinkQueryByTalentIdResponse,
	QueryKey
>;

export const getLinkQueryByTalentId = (talentId: string) => {
	const linkQuery = useQuery<getLinkQueryByTalentIdResponse, AxiosError>(
		['linkDocument', talentId],
		async () => {
			const url = urlJoin(PCALL_API_URL, 'link/byTalentId', talentId);
			const { data } = await axios.get<getLinkQueryByTalentIdResponse>(url);
			return data;
		}
	);
	return linkQuery;
};
