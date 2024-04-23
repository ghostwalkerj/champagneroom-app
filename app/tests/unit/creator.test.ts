import 'dotenv/config';

import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';

import { Agent, type AgentDocument } from '$lib/models/agent';
import { Creator } from '$lib/models/creator';
import { User, type UserDocument } from '$lib/models/user';
import { Wallet, type WalletDocument } from '$lib/models/wallet';

import { AuthType, UserRole } from '$lib/constants';

let wallet: WalletDocument;
describe('createCreator', () => {
  beforeEach(async () => {
    wallet = new Wallet();
    await wallet.save();
  });
  it('inserts and reads a self signup Creator', async () => {
    // create User
    const password = generateSillyPassword({
      wordCount: 2
    });
    const user = new User({
      name: 'test123',
      wallet: wallet._id,
      roles: [UserRole.CREATOR],
      authType: AuthType.PATH_PASSWORD,
      secret: nanoid(),
      password: `${password}${process.env.PASSWORD_SALT}`
    }) as UserDocument;

    await user.save();

    // create Creator
    const creator = new Creator({
      user: user._id
    });

    await creator.save();

    // Check values
    expect(creator).toBeTruthy();
    expect(creator._id).toBeTruthy();
    expect(creator.user._id).toStrictEqual(user._id);

    // Check roles
    expect(user.isAgent()).toBeFalsy();
    expect(user.isOperator()).toBeFalsy();
    expect(user.isCreator()).toBeTruthy();
  }),
    it('inserts and reads a Creator from an agent', async () => {
      // create agent
      const user = new User({
        name: 'test123',
        wallet: wallet._id,
        roles: [UserRole.AGENT],
        authType: AuthType.SIGNING,
        address: '0x0000000000000000000000000000000000000000'
      }) as UserDocument;
      await user.save();

      const agent = new Agent({
        user: user._id,
        defaultCommissionRate: 10
      }) as AgentDocument;
      await agent.save();

      // Create Creator
      const creatorUser = new User({
        name: 'test123',
        wallet: wallet._id,
        roles: [UserRole.CREATOR],
        authType: AuthType.PATH_PASSWORD,
        secret: nanoid(),
        password: `${generateSillyPassword({ wordCount: 2 })}${process.env.PASSWORD_SALT}`
      }) as UserDocument;
      await creatorUser.save();

      const creator = new Creator({
        user: creatorUser._id,
        agent: agent._id,
        commissionRate: agent.defaultCommissionRate
      });

      await creator.save();

      // Check values
      expect(creator).toBeTruthy();
      expect(creator._id).toBeTruthy();
      expect(creator.user._id).toStrictEqual(creatorUser._id);
      expect(creator.agent).toBeTruthy();
      expect(creator.agent?._id).toStrictEqual(agent._id);
      expect(creator.commissionRate).toBe(agent.defaultCommissionRate);
    });
});
