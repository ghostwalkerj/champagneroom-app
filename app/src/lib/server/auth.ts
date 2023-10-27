import * as web3 from 'web3';

import {
  PUBLIC_AUTH_PATH,
  PUBLIC_SHOW_PATH,
  PUBLIC_SIGNUP_PATH
} from '$env/static/public';

export { PUBLIC_APP_PATH as APP_PATH } from '$env/static/public';

export const PATH_WHITELIST = [
  PUBLIC_SHOW_PATH,
  PUBLIC_AUTH_PATH,
  PUBLIC_SIGNUP_PATH
];

export const verifyPath = (requestedPath: string, allowedPaths: string[]) => {
  // If the requested path is not in the whitelist, return false
  console.log('requestedPath', requestedPath);
  console.log('allowedPaths', allowedPaths);
  return allowedPaths.some((path) => requestedPath.startsWith(path));
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
