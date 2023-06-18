import { redirect } from '@sveltejs/kit';
import urlJoin from 'url-join';

import { AUTH_SIGNING_MESSAGE } from '$env/static/private';
import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

import { Operator } from '$lib/models/operator';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const address = params.address;
  const operatorUrl = urlJoin(url.origin, PUBLIC_OPERATOR_PATH);

  if (address === null) {
    throw redirect(307, operatorUrl);
  }

  const operator = await Operator.findOne({ 'user.address': address })
    .orFail(() => {
      throw redirect(307, operatorUrl);
    })
    .lean()
    .exec();

  const signingMessage = AUTH_SIGNING_MESSAGE + operator.user.nonce;
  return {
    signingMessage
  };
};
