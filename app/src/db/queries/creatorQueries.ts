import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';
import type { CreatorDocument } from 'db/models/creator';
import { PCALL_API_URL } from 'lib/constants';
import urlJoin from 'url-join';

export type getCreatorsByAgentAddressResponse = {
	creators: CreatorDocument[];
};

export type creatorsQueryResult = UseQueryStoreResult<
	getCreatorsByAgentAddressResponse,
	AxiosError<unknown, unknown>,
	getCreatorsByAgentAddressResponse,
	QueryKey
>;

export const getCreatorsByAgentAddress = (address: string) => {
	const creatorsQuery = useQuery<getCreatorsByAgentAddressResponse, AxiosError>(
		['creators', address],
		async () => {
			const url = urlJoin(PCALL_API_URL, 'creators/byAgentAddress', address);
			const { data } = await axios.get<getCreatorsByAgentAddressResponse>(url);
			return data;
		}
	);
	return creatorsQuery;
};
