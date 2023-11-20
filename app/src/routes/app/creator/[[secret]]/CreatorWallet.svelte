<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import { CurrencyType } from '$lib/models/common';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';

  import type { ActionData } from '../$types';

  export let destination = '';
  export let exchangeRate = 0;
  export let form: ActionData;
  export let wallet: WalletDocumentType;

  $: hasTransactions = wallet.earnings.length + wallet.payouts.length > 0;
  $: hasAvailableBalance = wallet.availableBalance > 0;
  let transactionModal: HTMLDialogElement;
  let withdrawModal: HTMLDialogElement;

  $: earnings = wallet.earnings;
  $: payouts = wallet.payouts;
  $: availableBalance = wallet.availableBalance;

  const onSubmit = () => {
    return async ({ result }) => {
      if (result.type === 'success') {
        withdrawModal.close();
      }
      await applyAction(result);
    };
  };
</script>

{#if hasTransactions}
  <dialog id="transaction_modal" class="modal" bind:this={transactionModal}>
    <div class="modal-box">
      <h3 class="font-bold text-lg text-center">Recent Transactions</h3>
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
                <span>{new Date(payout.payoutAt).toLocaleDateString()}</span>
                <span>{payout.payoutStatus}</span>
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

{#if hasAvailableBalance}
  <dialog id="withdraw_modal" class="modal" bind:this={withdrawModal}>
    <div class="modal-box lg:w-2/3 py-4 px-6 text-center rounded-lg">
      <h3 class="font-bold text-2xl mb-4">
        Withdraw Funds into your Own Wallet
      </h3>
      <div class="modal-action justify-center">
        <form method="post" action="?/request_payout" use:enhance={onSubmit}>
          <input type="hidden" name="walletId" value={wallet._id.toString()} />

          <div class="label-text mb-2">Amount in {wallet.currency}</div>
          <input
            type="text"
            name="amount"
            class="w-full input input-bordered input-primary mb-4 h-12 rounded-lg"
            placeholder="0.000000000"
            value={form?.amount ?? ''}
          />
          {#if form?.missingAmount || form?.invalidAmount}
            <div class="shadow-md alert alert-error whitespace-nowrap mb-4">
              Enter Amount to Transfer
            </div>
          {/if}
          {#if form?.insufficientBalance}
            <div class="shadow-md alert alert-error whitespace-nowrap mb-4">
              Insufficient Balance
            </div>
          {/if}

          <div class="label-text mb-2">Destination Address</div>
          <input
            type="text"
            name="destination"
            class="w-full input input-bordered input-primary mb-4 h-12 rounded-lg"
            placeholder="Address"
            readonly={destination !== ''}
            value={destination ?? form?.destination ?? ''}
          />
          {#if form?.missingDestination}
            <div class="shadow-md alert alert-error whitespace-nowrap mb-4">
              Enter a valid Destination Address
            </div>
          {/if}

          <div class="flex flex-col lg:flex-row lg:justify-between lg:gap-4">
            <button class="btn btn-primary mb-2 lg:mb-0">Submit</button>
            <button
              class="btn"
              on:click|preventDefault={() => withdrawModal.close()}
              >Cancel</button
            >
          </div>
        </form>
      </div>
    </div>
  </dialog>
{/if}

<div class="bg-primary h-full text-primary-content card">
  <div class="text-center card-body items-center p-3">
    <h2 class="text-2xl card-title">My Wallet</h2>
    <div class="text-accent lowercase">({wallet.status})</div>

    <!-- Common style for both MD and LG breakpoints -->
    <div class="bg-primary text-primary-content stats flex">
      <div class="flex flex-col p-2">
        <!-- Adjusted styling for Available Balance -->
        <div class="stat-title text-info text-lg lg:text-2xl">
          Available Balance
        </div>
        <div class="stat-value text-xl lg:text-3xl">
          {currencyFormatter(wallet.currency).format(availableBalance)}
          {#if exchangeRate > 0}
            <div class="text-sm text-primary-content">
              ({currencyFormatter(CurrencyType.USD, 2).format(
                availableBalance * exchangeRate
              )})
            </div>
          {/if}
        </div>

        <!-- Adjusted styling for stat-actions -->
        <div
          class="stat-actions flex gap-2 mt-2 md:mt-4 lg:mt-6 md:flex-col lg:flex-row"
        >
          <button
            class="btn btn-sm"
            disabled={!hasTransactions}
            on:click={() => transactionModal.show()}>Transactions</button
          >
          <button
            class="btn btn-sm"
            disabled={!hasAvailableBalance}
            on:click={() => withdrawModal.show()}>Withdraw</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
