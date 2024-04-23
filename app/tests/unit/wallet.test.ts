import { Wallet, WalletStatus } from '$lib/models/wallet';

import { CurrencyType } from '$lib/constants';

describe('createWallet', () => {
  it('inserts a Wallet and generates default values', async () => {
    const wallet = new Wallet();
    await wallet.save();

    // Check default values
    expect(wallet._id).toBeTruthy();
    expect(wallet.balance).toBe(0);
    expect(wallet.status).toBe(WalletStatus.AVAILABLE);
    expect(wallet.availableBalance).toBe(0);
    expect(wallet.onHoldBalance).toBe(0);
    expect(wallet.payouts).toEqual([]);
    expect(wallet.earnings).toEqual([]);
    expect(wallet.active).toBe(true);
    expect(wallet.currency).toBe(CurrencyType.ETH);
  });
});

describe('updateWallet', () => {
  it('updates a Wallet', async () => {
    const wallet = new Wallet();
    await wallet.save();

    wallet.balance = 100;
    wallet.status = WalletStatus.PAYOUT_IN_PROGRESS;
    wallet.active = false;
    await wallet.save();

    expect(wallet.balance).toBe(100);
    expect(wallet.status).toBe(WalletStatus.PAYOUT_IN_PROGRESS);
    expect(wallet.active).toBe(false);
  });
});
