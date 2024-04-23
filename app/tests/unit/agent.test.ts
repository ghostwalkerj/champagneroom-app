import { Agent, type AgentDocument } from '$lib/models/agent';
import { User, type UserDocument } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { UserRole } from '$lib/constants';

describe('createAgent', () => {
  it('inserts and reads an Agent', async () => {
    // create User
    const wallet = new Wallet();
    await wallet.save();

    const user = new User({
      name: 'test123',
      wallet: wallet._id,
      roles: [UserRole.AGENT]
    }) as UserDocument;

    await user.save();

    const agent = new Agent({
      user: user._id,
      defaultCommissionRate: 10
    }) as AgentDocument;

    await agent.save();

    // Check values
    expect(agent).toBeTruthy();
    expect(agent._id).toBeTruthy();
    expect(agent.user._id).toStrictEqual(user._id);
    expect(agent.defaultCommissionRate).toBe(10);

    // Check roles
    expect(user.isAgent()).toBeTruthy();
    expect(user.isOperator()).toBeFalsy();
    expect(user.isCreator()).toBeFalsy();
  });
});
