import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  const isAuthenticated = user === undefined ? false : true;
  return {
    isAuthenticated
  };
};
