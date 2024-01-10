<script lang="ts">
  import { CurrencyType } from '$lib/constants';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';
  import type { ActionData } from '../routes/app/$types';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import Icon from '@iconify/svelte';

  export let destination = '';
  export let exchangeRate = 0;
  export let form: ActionData;
  export let wallet: WalletDocumentType;
  export let whitdrawForm: any;


const modalStore = getModalStore();

  $: hasTransactions =
    wallet && wallet.earnings.length && wallet.payouts.length > 0;
  $: hasAvailableBalance = wallet && wallet.availableBalance > 0;

  $: earnings = wallet?.earnings;
  $: payouts = wallet?.payouts;
  $: availableBalance = wallet?.availableBalance || 0;

  const modal: ModalSettings = {
    type: 'component',
    component: 'WithdrawForm',
    meta: {
      form: whitdrawForm,
      wallet,
      exchangeRate,
      destination
    }
  };

const transactionsModal: ModalSettings = {
    type: 'component',
    component: 'TransactionsActivity',
    meta: {
      earnings:earnings,
      payouts: payouts
    }
  };
</script>

{#if wallet}
    <div class="bg-custom p-4 rounded flex flex-col gap-4 justify-center items-center">

      <div class="flex flex-col gap-0 items-center text-center">
        <h2 class="text-xl font-semibold flex gap-2 items-center">
          <Icon
        class="text-secondary"
        icon="carbon:wallet"
      />
          Wallet</h2>
        <small class="lowercase text-base">Status: {wallet.status}</small>
      </div>

      <div class="text-center">
        <p>Balance:
          {#if exchangeRate > 0}
            <span class="font-semibold">
              {currencyFormatter(CurrencyType.USD, 2).format(
                availableBalance * exchangeRate
              )} USD
            </span>
          {/if}
        </p>
        <p> {currencyFormatter(wallet.currency).format(availableBalance)}</p>
      </div>

      <div
            class="flex gap-2"
          >
            <button
              class="btn variant-soft-secondary btn-sm neon-secondary"
              disabled={!hasTransactions}
              on:click={() => modalStore.trigger(transactionsModal)}
            >
              Transactions
            </button>
            <button
              class="btn variant-soft-secondary btn-sm neon-secondary"
              disabled={!hasAvailableBalance}
              on:click={() => modalStore.trigger(modal)}
            >
              Withdraw
            </button>
          </div>
    </div>
{/if}


