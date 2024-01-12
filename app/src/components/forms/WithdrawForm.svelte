<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import type { WalletDocumentType } from '$lib/models/wallet';
  import Icon from '@iconify/svelte';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  let meta = $modalStore[0].meta;
  let wallet: WalletDocumentType = meta.wallet;
  let availableBalance: number = meta.availableBalance || 0;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    $modalStore[0].meta.form,
    {
      validationMethod: 'auto',
      onError({ result }) {
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
    class="bg-surface-900 p-4 max-w-3xl rounded flex gap-4 flex-col"
  >
    <h2 class="font-semibold text-xl">Withdraw funds into your own wallet</h2>

    <input type="hidden" name="walletId" bind:value={$form.walletId} readonly />

    <label for="">
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
          class="btn variant-soft-secondary"
          type="button"
          on:click={() => ($form.amount = availableBalance)}
          >Set Curent Balance</button
        >
      </div>
      {#if $errors.amount}<span class="text-error">{$errors.amount}</span>{/if}
    </label>

    <label for="">
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
    </label>

    <footer class="text-right font-semibold">
      <button
        class="btn variant-soft-error"
        disabled={$delayed}
        type="button"
        on:click={parent.onClose}>{parent.buttonTextCancel}</button
      >
      <button
        class="btn variant-soft-primary neon-primary gap-2"
        disabled={$delayed}
        type="submit"
        >Request Payout {#if $delayed}<Icon
            icon="eos-icons:loading"
          />{/if}</button
      >
      {#if $message}
        <br />
        <p class="text-error mt-2">{$message}</p>
      {/if}
    </footer>
  </form>
{/if}
