// eslint-disable-next-line @typescript-eslint/naming-convention
import { ObjectManager } from '@filebase/sdk';
import urlJoin from 'url-join';

import { env } from '$env/dynamic/private';

export const ipfsUpload = async (file: File): Promise<string> => {
  // Initialize ObjectManager
  const bucketName = env.FILEBASE_BUCKET_NAME;
  const thing: ObjectManager = new ObjectManager(bucketName, '1', '2');
  // const objectManager = new ObjectManager(
  //   'ipfs',
  //   'https://ipfs.infura.io:5001',
  //   {
  //     bucket: bucketName
  //   }
  // );
  // const objectName = nanoid();
  // const uploadedObject = await objectManager.upload(
  //   objectName,
  //   file.stream(),
  //   {},
  //   {
  //     bucket: bucketName
  //   }
  // );

  //const url = urlJoin(env.FILEBASE_IPFS_GATEWAY || '', uploadedObject.cid);
  const url = urlJoin(env.FILEBASE_IPFS_GATEWAY || '', 'cid');

  return url;
};
