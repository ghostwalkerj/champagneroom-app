import 'dotenv/config';

import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';
import { expect } from 'vitest';

import { User, type UserDocument } from '$lib/models/user';
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
      password: `${password}${process.env.PASSWORD_SALT}`
    }) as UserDocument;

    await user.save();

    // Check values
    expect(user).toBeTruthy();
    expect(user._id).toBeTruthy();
    expect(user.authType).toBe(AuthType.PATH_PASSWORD);
    expect(user.name).toBe('test123');
    expect(user.secret).toBe(secret);
    expect(user.wallet).toBe(wallet._id);
    expect(user.profileImageUrl).toBe(config.UI.defaultProfileImage);
    expect(user.referralCode).toBeTruthy();
    expect(user.referralCode?.length).toBeGreaterThanOrEqual(10);

    // Password should be hashed
    expect(user.password).not.toEqual(
      `${password}${process.env.PASSWORD_SALT}`
    );
    expect(
      await user.comparePassword(`${password}${process.env.PASSWORD_SALT}`)
    ).toBeTruthy();

    // Check roles
    expect(user.isCreator()).toBeTruthy();
    expect(user.isAgent()).toBeFalsy();
    expect(user.isOperator()).toBeFalsy();
  });
});
