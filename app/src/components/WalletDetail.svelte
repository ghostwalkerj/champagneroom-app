<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import { CurrencyType } from '$lib/constants';
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';
  import type { ActionData } from '../routes/app/$types';

  export let destination = '';
  export let exchangeRate = 0;
  export let form: ActionData;
  export let wallet: WalletDocumentType;

  $: hasTransactions =
    wallet && wallet.earnings.length + wallet.payouts.length > 0;
  $: hasAvailableBalance = wallet && wallet.availableBalance > 0;
  let transactionModal: HTMLDialogElement;
  let withdrawModal: HTMLDialogElement;
  let amountElement: HTMLInputElement;

  $: earnings = wallet?.earnings;
  $: payouts = wallet?.payouts;
  $: availableBalance = wallet?.availableBalance || 0;

  const onSubmit = () => {
    return async ({ result }) => {
      if (result.type === 'success') {
        withdrawModal.close();
      }
      await applyAction(result);
    };
  };
</script>

{#if wallet}
  {#if hasTransactions}
    <dialog
      id="transaction_modal"
      class="daisy-modal"
      bind:this={transactionModal}
    >
      <div class="daisy-modal-box">
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
        <div class="daisy-modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="daisy-btn">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  {/if}

  {#if hasAvailableBalance}
    <dialog id="withdraw_modal" class="daisy-modal" bind:this={withdrawModal}>
      <div class="daisy-modal-box lg:w-2/3 py-4 px-6 text-center rounded-lg">
        <h3 class="font-bold text-2xl mb-4">
          Withdraw Funds into your Own Wallet
        </h3>
        <div class="daisy-modal-action justify-center">
          <form method="post" action="?/request_payout" use:enhance={onSubmit}>
            <input
              type="hidden"
              name="walletId"
              value={wallet._id.toString()}
            />

            <div class="daisy-label-text mb-2">Amount in {wallet.currency}</div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                name="amount"
                bind:this={amountElement}
                class="w-full daisy-input daisy-input-bordered daisy-input-primary mb-4 h-12 rounded-lg"
                value={form?.amount ?? ''}
              />
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                class="daisy-btn daisy-btn-xs mb-4"
                on:click={() =>
                  (amountElement.value = availableBalance.toString())}
              >
                Max
              </div>
            </div>
            {#if form?.missingAmount || form?.invalidAmount}
              <div
                class="shadow-md daisy-alert daisy-alert-error whitespace-nowrap mb-4"
              >
                Enter Amount to Transfer
              </div>
            {/if}
            {#if form?.insufficientBalance}
              <div
                class="shadow-md daisy-alert daisy-alert-error whitespace-nowrap mb-4"
              >
                Insufficient Balance
              </div>
            {/if}

            <div class="daisy-label-text mb-2">Destination Address</div>
            <input
              type="text"
              name="destination"
              class="w-full daisy-input daisy-input-bordered daisy-input-primary mb-4 h-12 rounded-lg"
              placeholder="Address"
              readonly={destination !== ''}
              value={destination ?? form?.destination ?? ''}
            />
            {#if form?.missingDestination}
              <div
                class="shadow-md daisy-alert daisy-alert-error whitespace-nowrap mb-4"
              >
                Enter a valid Destination Address
              </div>
            {/if}

            <div class="flex flex-col lg:flex-row lg:justify-between lg:gap-4">
              <button class="daisy-btn daisy-btn-primary mb-2 lg:mb-0"
                >Submit</button
              >
              <button
                class="daisy-btn"
                on:click|preventDefault={() => withdrawModal.close()}
                >Cancel</button
              >
            </div>
          </form>
        </div>
      </div>
    </dialog>
  {/if}

  <div class="bg-primary h-full text-primary-content daisy-card">
    <div class="daisy-card-body text-center items-center p-3">
      <h2 class="daisy-card-title text-2xl">My Wallet</h2>
      <div class="text-accent lowercase">({wallet.status})</div>

      <!-- Responsive container -->
      <div
        class="bg-primary text-primary-content flex flex-col lg:flex-row justify-around"
      >
        <!-- Flex container for content -->
        <div class="flex flex-col items-center">
          <!-- Available Balance -->
          <div class="daisy-stat-title text-info text-lg lg:text-xl">
            Available Balance
          </div>
          <div class="daisy-stat-value text-lg xl:text-xl">
            {currencyFormatter(wallet.currency).format(availableBalance)}
            {#if exchangeRate > 0}
              <div class="text-sm text-primary-content">
                ({currencyFormatter(CurrencyType.USD, 2).format(
                  availableBalance * exchangeRate
                )} USD)
              </div>
            {/if}
          </div>

          <!-- Buttons with responsive spacing -->
          <div
            class="daisy-stat-actions flex gap-2 mt-2 lg:mt-4 xl:mt-6 flex-col lg:flex-row justify-center lg:justify-start"
          >
            <button
              class="daisy-btn daisy-btn-base lg:btn-sm"
              disabled={!hasTransactions}
              on:click={() => transactionModal.show()}
            >
              Transactions
            </button>
            <button
              class="daisy-btn daisy-btn-base lg:btn-sm"
              disabled={!hasAvailableBalance}
              on:click={() => withdrawModal.show()}
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
