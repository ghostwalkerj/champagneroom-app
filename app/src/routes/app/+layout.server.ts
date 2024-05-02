import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const authType = locals.authType;

  return {
    authType
  };
};
