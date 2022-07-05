import { useQuery, type QueryKey, type UseQueryStoreResult } from '@sveltestack/svelte-query';
import type { AxiosError } from 'axios';
import axios from 'axios';
import type { AgentDocument } from 'db/models/agent';
import { PCALL_API_URL } from 'lib/constants';
import urlJoin from 'url-join';

export type getOrCreateAgentByAddressResponse = {
	agent: AgentDocument;
};

export type agentQueryResult = UseQueryStoreResult<
	getOrCreateAgentByAddressResponse,
	AxiosError<unknown, unknown>,
	getOrCreateAgentByAddressResponse,
	QueryKey
>;

export const getOrCreateAgentByAddress = (address: string) => {
	const agentQuery = useQuery<getOrCreateAgentByAddressResponse, AxiosError>(
		['agent', address],
		async () => {
			const url = urlJoin(PCALL_API_URL, 'agent/byAddress', address);
			const { data } = await axios.get<getOrCreateAgentByAddressResponse>(url);
			return data;
		}
	);
	return agentQuery;
};
