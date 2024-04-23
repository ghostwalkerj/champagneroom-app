import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';
import { expect } from 'vitest';

import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import config from '$lib/config';
import { AuthType, EntityType } from '$lib/constants';

describe('createUser', () => {
  it('inserts and reads a User', async () => {
    const password = generateSillyPassword({
      wordCount: 2
    });
    const secret = nanoid();

    const wallet = new Wallet();

    await wallet.save();

    const user = new User({
      name: 'test123',
      authType: AuthType.PATH_PASSWORD,
      secret,
      wallet: wallet._id,
      roles: [EntityType.CREATOR],
      referralCode: nanoid(10),
      password,
      profileImageUrl: config.UI.defaultProfileImage
    });

    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('password');
    expect(user?.name).toBe('test123');
  });
});
