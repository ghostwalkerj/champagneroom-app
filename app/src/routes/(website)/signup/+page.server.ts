import { fail } from '@sveltejs/kit';
import validator from 'validator';

import { InterestForm } from '$lib/models/interestForm';

import type { Actions } from './$types';

export const actions: Actions = {
  show_interest: async ({ request }) => {
    const data = await request.formData();
    const interest = data.get('interest') as string;
    const email = data.get('email') as string;

    if (!interest) {
      return fail(400, { interest, missingInterest: true });
    }

    if (!email) {
      return fail(400, { email, badEmail: true });
    }

    const isEmail = validator.isEmail(email);
    if (!isEmail) {
      return fail(400, { email, badEmail: true });
    }

    try {
      InterestForm.create({
        interest,
        email
      });
    } catch (error) {
      return fail(400, { err: error });
    }

    return {
      success: true
    };
  }
};
