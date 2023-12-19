import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  const ticket = locals.ticket;
  return {
    user: user
      ? user.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    ticket: ticket
      ? ticket.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined
  };
};
