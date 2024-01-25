import { CarReader } from '@ipld/car';
import type { API } from '@ucanto/core';
import { importDAG } from '@ucanto/core/delegation';
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/access/stores/store-memory';
import { create } from '@web3-storage/w3up-client';
import type { SharedSpace } from '@web3-storage/w3up-client/space';

import { WEB3STORAGE_DOMAIN } from '$env/static/private';

async function parseProof(data: string): Promise<any> {
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  const blocks: Array<API.Transport.Block<any, number, number, 1>> = [];
  for await (const block of reader.blocks()) {
    blocks.push(block as API.Transport.Block<any, number, number, 1>);
  }
  return importDAG(blocks);
}

/**
 * Uploads an image to Web3 storage.
 * @param key Key for the principal
 * @param proof Proof for the operation, base64 encoded CAR file
 * @param image Image file to upload
 */
export const web3Upload = async (
  key: string,
  proof: string,
  image: File
): Promise<string> => {
  const principal = Signer.parse(key);
  const client = await create({ principal, store: new StoreMemory() });
  const parsedProof = await parseProof(proof);

  const space: SharedSpace = await client.addSpace(parsedProof);
  await client.setCurrentSpace(space.did());
  const cid = await client.uploadFile(image);
  return 'https://' + cid.toString() + WEB3STORAGE_DOMAIN;
};
