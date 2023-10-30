import * as web3 from 'web3';

import {
  PUBLIC_AUTH_PATH,
  PUBLIC_CREATOR_PATH,
  PUBLIC_SHOW_PATH,
  PUBLIC_SIGNUP_PATH,
  PUBLIC_TICKET_PATH
} from '$env/static/public';

export { PUBLIC_APP_PATH as APP_PATH } from '$env/static/public';

export const PATH_WHITELIST = [
  PUBLIC_SHOW_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_SIGNUP_PATH
];

export const SECRET_PATHS = [PUBLIC_CREATOR_PATH, PUBLIC_TICKET_PATH];

export const getSecretSlug = (requestedPath: string | undefined) => {
  let secret: string | undefined;
  let slug: string | undefined;
  if (
    requestedPath &&
    SECRET_PATHS.some((path) => requestedPath.startsWith(path))
  ) {
    const pathParts = requestedPath.split('/');
    console.log('pathParts', pathParts);
    if (pathParts.length > 3) {
      secret = pathParts.at(-1);
      slug = pathParts.at(-2);
    }
  }
  return { secret, slug };
};

export const verifyPath = (requestedPath: string, allowedPaths: string[]) => {
  // If the requested path is not in the whitelist, return false
  console.log('requestedPath', requestedPath);
  console.log('allowedPaths', allowedPaths);
  return allowedPaths.includes(requestedPath);
};

export const verifySignature = (
  message: string,
  address: string,
  signature: string
) => {
  try {
    const signerAddr = web3.eth.accounts.recover(message, signature);
    if (signerAddr.toLowerCase() !== address.toLowerCase()) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
