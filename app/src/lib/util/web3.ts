import coinbaseWalletModule from '@web3-onboard/coinbase';
import Onboard from '@web3-onboard/core';
import type { Account, WalletState } from '@web3-onboard/core/dist/types';
import frameModule from '@web3-onboard/frame';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule from '@web3-onboard/walletconnect';
import { derived, writable } from 'svelte/store';

import {
  PUBLIC_INFURA_API_KEY,
  PUBLIC_WALLET_CONNECT_PROJECT_ID
} from '$env/static/public';

// Wallets
const injected = injectedModule();
const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true });
const frame = frameModule();
const trezor = trezorModule({
  email: 'admin@champagneroom.app',
  appUrl: 'https://champagneroom.app'
});
const ledger = ledgerModule();

const wcV2InitOptions = {
  version: 2 as const,
  /**
   * Project ID associated with [WalletConnect account](https://cloud.walletconnect.com)
   */
  projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
  /**
   * Chains required to be supported by all wallets connecting to your DApp
   */
  requiredChains: [1]
};
const walletConnect = walletConnectModule(wcV2InitOptions);

const wallets = [
  injected,
  coinbaseWalletSdk,
  frame,
  trezor,
  ledger,
  walletConnect
];

const appMetadata = {
  name: 'Champagne Room',
  description: 'Living Large in the Champagne Room',
  icon: 'https://champagneroom.app/logo.png',
  logo: 'https://champagneroom.app/logo.png',
  recommendedInjectedWallets: [
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
    { name: 'MetaMask', url: 'https://metamask.io' }
  ]
};

const chains = [
  {
    id: 1,
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${PUBLIC_INFURA_API_KEY}`
  }
];

const onboard = Onboard({
  wallets,
  chains,
  appMetadata,
  connect: {
    autoConnectLastWallet: true
  },
  theme: 'dark',
  accountCenter: {
    desktop: {
      enabled: true,
      position: 'topRight',
      minimal: true
    },
    mobile: {
      enabled: true,
      position: 'topRight'
    }
  }
});

const wallets$ = onboard.state.select('wallets');

// eslint-disable-next-line @typescript-eslint/naming-convention
const _selectedAccount = writable<Account | undefined>();
// eslint-disable-next-line @typescript-eslint/naming-convention
const _defaultWallet = writable<WalletState | undefined>();

wallets$.subscribe((wallets) => {
  _selectedAccount.set(wallets?.[0]?.accounts?.[0]);
  _defaultWallet.set(wallets?.[0]);
});

export const connect = async () => {
  await onboard.connectWallet();
};

export const defaultWallet = derived(_defaultWallet, ($defaultWallet) => {
  return $defaultWallet;
});

export const disconnect = () => {
  if (wallets$?.[0]?.label) {
    onboard.disconnectWallet({ label: wallets$?.[0]?.label });
    _selectedAccount.set(undefined);
    _defaultWallet.set(undefined);
  }
};

export const selectedAccount = derived(_selectedAccount, ($selectedAccount) => {
  return $selectedAccount;
});
