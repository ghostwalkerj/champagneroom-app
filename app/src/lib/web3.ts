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
    PUBLIC_STATIC_URL,
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

const wcV2InitOptions = {
  version: 2 as const,
  projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
  requiredChains: [1],
  dappUrl: 'https://champagneroom.app'
};
const walletConnect = walletConnectModule(wcV2InitOptions);

const ledger = ledgerModule({
  walletConnectVersion: 2,
  projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
  requiredChains: [1]
});

const wallets = [
  injected,
  walletConnect,
  ledger,
  coinbaseWalletSdk,
  frame,
  trezor
];

const appMetadata = {
  name: 'Champagne Room',
  description: 'Living Large in the Champagne Room',
  icon: `${PUBLIC_STATIC_URL}/assets/logo-tr.png`,
  logo: `${PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png`,
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
  },
  {
    id: 11_155_111,
    token: 'SepoliaETH',
    label: 'Ethereum Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${PUBLIC_INFURA_API_KEY}`
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
      position: 'bottomRight',
      minimal: true
    },
    mobile: {
      enabled: true,
      position: 'bottomRight'
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

export const currentState = onboard.state.get();

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