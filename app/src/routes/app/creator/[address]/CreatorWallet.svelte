<script lang="ts">
  import { CurrencyType } from '$lib/models/common';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';

  export let exchangeRate = 0;
  export let wallet: WalletDocumentType;

  const hasTransactions = wallet.earnings.length + wallet.payouts.length > 0;
  let transactionModal: HTMLDialogElement;
</script>

{#if hasTransactions}
  <dialog id="transaction_modal" class="modal" bind:this={transactionModal}>
    <div class="modal-box">
      <h3 class="font-bold text-lg">Recent Transactions</h3>
      <p class="py-4">Press ESC key or click the button below to close</p>
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
          {currencyFormatter(wallet.currency).format(wallet.balance)}
          {#if exchangeRate > 0}
            <div class="text-sm text-primary-content">
              ({currencyFormatter(CurrencyType.USD, 2).format(
                wallet.balance * exchangeRate
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
          <button class="btn btn-sm">Withdraw</button>
        </div>
      </div>
    </div>
  </div>
</div>
