import { CarReader } from '@ipld/car';
import { importDAG } from '@ucanto/core/delegation';
import type { API } from '@ucanto/core/lib';
import * as Signer from '@ucanto/principal/ed25519';
import { create } from '@web3-storage/w3up-client';
import type { SharedSpace } from '@web3-storage/w3up-client/dist/src/space';

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
): Promise<void> => {
  if (image) {
    const principal = Signer.parse(key);
    const client = await create({ principal });
    const parsedProof = await parseProof(proof);
    const space: SharedSpace = await client.addSpace(parsedProof);
    await client.setCurrentSpace(space.did());
  }
};
