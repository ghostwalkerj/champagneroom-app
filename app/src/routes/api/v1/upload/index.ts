import {
	INFURA_IPFS_API_PORT,
	INFURA_IPFS_API_URL,
	INFURA_IPFS_DEDICATED_GATEWAY,
	INFURA_IPFS_PROJECT_ID,
	INFURA_IPFS_PROJECT_SECRET
} from '$lib/constants';
import type { RequestHandler } from '@sveltejs/kit';
import ipfsClient from 'ipfs-http-client';

const auth =
	'Basic ' +
	Buffer.from(INFURA_IPFS_PROJECT_ID + ':' + INFURA_IPFS_PROJECT_SECRET).toString('base64');

const addOptions = {
	pin: true
};

const client = ipfsClient.create({
	host: INFURA_IPFS_API_URL,
	port: INFURA_IPFS_API_PORT,
	protocol: 'https',
	headers: {
		authorization: auth
	}
});

export const POST: RequestHandler = async ({ request }) => {
	let url = '';
	const body = await request.formData();
	const file = body.get('file') as File;
	if (file) {
		try {
			const result = await client.add(file, addOptions);
			url = `${INFURA_IPFS_DEDICATED_GATEWAY}/ipfs/${result.path}`;
		} catch (error) {
			console.log('error', error);
		}
		return {
			status: 200,
			body: { url }
		};
	} else {
		return {
			status: 400
		};
	}
};
