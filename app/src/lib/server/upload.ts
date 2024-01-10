import { Web3Storage } from 'web3.storage';

import { WEB3STORAGE_API_TOKEN, WEB3STORAGE_DOMAIN } from '$env/static/private';

const client = new Web3Storage({ token: WEB3STORAGE_API_TOKEN });

export const web3Upload = async (image: File) => {
  if (image) {
    try {
      const rootCid = await client.put([image]);
      const response = await client.get(rootCid);
      // Web3Response
      if (response) {
        const files = await response.files(); // Web3File[]
        for (const file of files) {
          return `https://${file.cid}.ipfs.${WEB3STORAGE_DOMAIN}`;
        }
      }
    } catch (error) {
      console.error('error', error);
    }
  }
};
