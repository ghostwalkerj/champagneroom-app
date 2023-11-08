import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  const ticket = locals.ticket;
  return {
    user: user
      ? user.toObject({ flattenObjectIds: true, flattenMaps: true })
      : undefined,
    ticket: ticket
      ? ticket.toObject({ flattenObjectIds: true, flattenMaps: true })
      : undefined
  };
};
