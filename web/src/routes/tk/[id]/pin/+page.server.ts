import { PUBLIC_TICKET_PATH } from '$env/static/public';
import { masterDB } from '$lib/ORM/dbs/masterDB';
import { createPinHash } from '$lib/util/pin';
import { error, fail, redirect } from '@sveltejs/kit';
import urlJoin from 'url-join';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const actions: import('./$types').Actions = {
  set_pin: async ({ params, cookies, request, url }) => {
    const ticketId = params.id;

    const data = await request.formData();
    const pin = data.get('pin') as string;

    if (!pin) {
      return fail(400, { pin, missingPin: true });
    }

    const isNum = /^\d+$/.test(pin);
    if (!isNum) {
      return fail(400, { pin, invalidPin: true });
    }

    const hash = createPinHash(ticketId, pin);
    cookies.set('pin', hash, { path: '/' });
    const redirectUrl = urlJoin(url.origin, PUBLIC_TICKET_PATH, ticketId);
    throw redirect(303, redirectUrl);
  },
};
