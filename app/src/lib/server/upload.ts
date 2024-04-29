// eslint-disable-next-line @typescript-eslint/naming-convention
import { ObjectManager } from '@filebase/sdk';
import { nanoid } from 'nanoid';
import urlJoin from 'url-join';

import { env } from '$env/dynamic/private';
// Initialize ObjectManager
const bucketName = env.FILEBASE_BUCKET_NAME;
// Initialize ObjectManager
const objectManager = new ObjectManager(
  env.FILEBASE_API_KEY,
  env.FILEBASE_API_SECRET,
  {
    bucket: bucketName
  }
);
export const ipfsUpload = async (file: File): Promise<string> => {
  const objectName = nanoid();
  const uploadedObject = await objectManager.upload(
    objectName,
    file.stream(),
    {},
    {
      bucket: bucketName
    }
  );

  const url = urlJoin(env.FILEBASE_IPFS_GATEWAY || '', uploadedObject.cid);
  return url;
};
