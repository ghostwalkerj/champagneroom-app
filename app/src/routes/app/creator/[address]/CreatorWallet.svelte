<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { CurrencyType } from '$lib/models/common';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';

  import { walletStore } from '$stores';

  export let exchangeRate = 0;
  export let wallet: WalletDocumentType;

  const hasTransactions = wallet.earnings.length + wallet.payouts.length > 0;
  const hasAvailableBalance = wallet.availableBalance > 0;
  let transactionModal: HTMLDialogElement;
  let walletUnSub: Unsubscriber;

  $: earnings = wallet.earnings;
  $: payouts = wallet.payouts;
  $: availableBalance = wallet.availableBalance;

  onMount(() => {
    if (wallet.active) {
      walletUnSub = walletStore(wallet).subscribe((_wallet) => {
        console.log('wallet', _wallet);
        wallet = _wallet;
        earnings = wallet.earnings;
        payouts = wallet.payouts;
        availableBalance = wallet.availableBalance;
      });
    }
  });

  onDestroy(() => {
    walletUnSub?.();
  });
</script>

{#if hasTransactions}
  <dialog id="transaction_modal" class="modal" bind:this={transactionModal}>
    <div class="modal-box text-center">
      <h3 class="font-bold text-lg">Recent Transactions</h3>
      {#if earnings.length > 0}
        <div>
          <h4 class="font-bold text-md mt-6">Earnings</h4>
          <ul class="list-none">
            {#each earnings as earning}
              <li class="flex justify-between">
                <span>{new Date(earning.earnedAt).toLocaleDateString()}</span>

                <span
                  >{currencyFormatter(wallet.currency).format(
                    earning.amount
                  )}</span
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if payouts.length > 0}
        <div>
          <h4 class="font-bold text-md mt-6">Payouts</h4>
          <ul class="list-none">
            {#each payouts as payout}
              <li class="flex justify-between">
                <span>{new Date(payout.createdAt).toLocaleDateString()}</span>

                <span
                  >{currencyFormatter(wallet.currency).format(
                    payout.amount
                  )}</span
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn">Close</button>
        </form>
      </div>
    </div>
  </dialog>
{/if}

<div class="bg-primary h-full text-primary-content w-full card">
  <div class="text-center card-body items-center p-3">
    <h2 class="text-2xl card-title">My Wallet</h2>

    <div class="bg-primary text-primary-content stats">
      <div class="stat">
        <div class="stat-title text-info">Current balance</div>
        <div class="stat-value text-2xl">
          {currencyFormatter(wallet.currency).format(availableBalance)}
          {#if exchangeRate > 0}
            <div class="text-sm text-primary-content">
              ({currencyFormatter(CurrencyType.USD, 2).format(
                availableBalance * exchangeRate
              )})
            </div>
          {/if}
        </div>
        <div class="stat-actions">
          <button
            class="btn btn-sm"
            disabled={!hasTransactions}
            on:click={() => transactionModal.show()}>Transactions</button
          >
          <button class="btn btn-sm" disabled={!hasAvailableBalance}
            >Withdraw</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
