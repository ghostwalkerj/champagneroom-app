import { json } from '@sveltejs/kit';
import { Web3Storage } from 'web3.storage';
import type { RequestHandler } from './$types';
import { WEB3STORAGE_API_TOKEN, WEB3STORAGE_DOMAIN } from '$env/static/private';

const client = new Web3Storage({ token: WEB3STORAGE_API_TOKEN });

export const POST: RequestHandler = async ({ request }) => {
  let url = '';
  const body = await request.formData();
  const file = body.get('file') as File;
  if (file) {
    try {
      const rootCid = await client.put([file]);
      const res = await client.get(rootCid);
      // Web3Response
      if (res) {
        const files = await res.files(); // Web3File[]
        for (const file of files) {
          url = `https://${file.cid}.ipfs.${WEB3STORAGE_DOMAIN}`;
          break;
        }
      }
    } catch (error) {
      console.log('error', error);
    }
    return json({ url });
  } else {
    return new Response(undefined, { status: 400 });
  }
};
