import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  return {
    user: user
      ? user.toObject({ flattenObjectIds: true, flattenMaps: true })
      : undefined
  };
};
