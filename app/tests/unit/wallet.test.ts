import { Wallet } from '$lib/models/wallet';

describe('createWallet', () => {
  it('inserts a Wallet and generates default values', async () => {
    const wallet = new Wallet();
    await wallet.save();

    // Check default values
    expect(wallet._id).toBeTruthy();
  });
});
