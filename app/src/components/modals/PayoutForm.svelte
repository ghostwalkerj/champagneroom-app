<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';

  import type { WalletDocumentType } from '$lib/models/wallet';

  import type { requestPayoutSchema } from '$lib/payout';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  let meta = $modalStore[0].meta;
  let wallet: WalletDocumentType = meta.wallet;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    $modalStore[0].meta.form as SuperValidated<typeof requestPayoutSchema>,
    {
      validationMethod: 'auto',
      onError() {
        $message =
          'There was an error processing your request. Please try again later.';
      }
    }
  );
</script>

{#if $modalStore[0]}
  <form
    method="post"
    use:enhance
    action="?/request_payout"
    class="flex max-w-3xl flex-col gap-4 rounded bg-surface-900 p-4"
  >
    <h2 class="text-xl font-semibold">Withdraw funds into your own wallet</h2>

    <input type="hidden" name="walletId" bind:value={$form.walletId} readonly />
    <input
      type="hidden"
      name="currency"
      bind:value={$form.payoutReason}
      readonly
    />
    <input
      type="hidden"
      name="reason"
      bind:value={$form.payoutReason}
      readonly
    />

    <span>Amount in {wallet.currency}</span>
    <div class="flex gap-4">
      <input
        type="number"
        step="any"
        name="amount"
        bind:value={$form.amount}
        {...$constraints.amount}
        placeholder="Enter amount..."
        class="input variant-form-material bg-surface-800"
      />
      <span class="divider-vertical" />
      <button
        class="variant-soft-secondary btn"
        type="button"
        on:click={() => ($form.amount = wallet.availableBalance)}
        >Set Current Balance</button
      >
    </div>
    {#if $errors.amount}<span class="text-error">{$errors.amount}</span>{/if}

    <span>Destination address</span>
    <input
      type="text"
      name="destination"
      bind:value={$form.destination}
      {...$constraints.destination}
      placeholder="Enter destination address..."
      class="input variant-form-material bg-surface-800"
    />
    {#if $errors.destination}<span class="text-error"
        >{$errors.destination}</span
      >{/if}

    <footer class="text-right font-semibold">
      <button
        class="variant-soft-error btn"
        disabled={$delayed}
        type="button"
        on:click={parent.onClose}>{parent.buttonTextCancel}</button
      >
      <button
        class="neon-primary variant-soft-primary btn gap-2"
        disabled={$delayed}
        type="submit"
        >Request Payout {#if $delayed}<Icon
            icon="eos-icons:loading"
          />{/if}</button
      >
      {#if $message}
        <br />
        <p class="mt-2 text-error">{$message}</p>
      {/if}
    </footer>
  </form>
{/if}
