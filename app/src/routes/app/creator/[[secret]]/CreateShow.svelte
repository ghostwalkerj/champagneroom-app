<script lang="ts">
  import Icon from '@iconify/svelte';
  import { RangeSlider } from '@skeletonlabs/skeleton';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms';
  import urlJoin from 'url-join';
  import type { z } from 'zod';

  import type { showCRUDSchema, ShowDocument } from '$lib/models/show';

  import config from '$lib/config';
  import { durationFormatter } from '$lib/constants';

  export let createShowForm: SuperValidated<z.infer<typeof showCRUDSchema>>;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCreated: (show: ShowDocument) => void;

  const {
    form: showForm,
    errors,
    constraints,
    delayed,
    enhance
  } = superForm(createShowForm, {
    validationMethod: 'submit-only',
    dataType: 'json',
    onResult({ result }) {
      console.log(result);
      if (result.type === 'success') {
        switch (true) {
          case result.data!.showCreated: {
            const showUrl = urlJoin(
              window.location.origin,
              config.PATH.show,
              result.data!.show!._id.toString()
            );
            navigator.clipboard.writeText(showUrl);
            onShowCreated(result.data!.show);
            break;
          }
        }
      }
    }
  });
</script>

<form
  method="post"
  action="?/create_show"
  use:enhance
  class="bg-custom flex flex-col gap-4 rounded p-4"
>
  <h2 class="text-lg font-semibold">Create Show</h2>

  <div class="grid gap-4 lg:grid-cols-2">
    <label for="">
      <span>Show Title</span>
      <input
        type="text"
        name="name"
        bind:value={$showForm.name}
        {...$constraints.name}
        class="input variant-form-material h-[50px] bg-surface-700"
      />
      {#if $errors.name}<span class="text-error-500">{$errors.name}</span>{/if}
    </label>

    <label for="">
      <span>Ticket Price (In USD)</span>
      <div
        class="input-group input-group-divider variant-form-material h-[50px] grid-cols-[auto_1fr] bg-surface-700"
      >
        <div class="input-group-shim font-semibold text-surface-300">USD</div>
        <input
          type="number"
          name="price"
          placeholder="10"
          bind:value={$showForm.price.amount}
          {...$constraints.price?.amount}
        />
      </div>
      {#if $errors.price?.amount}<span class="text-error-500"
          >{$errors.price.amount}</span
        >{/if}
    </label>
  </div>

  <RangeSlider
    name="duration"
    accent={'accent-primary'}
    bind:value={$showForm.duration}
    min={10}
    max={120}
    step={10}
    ticked
  >
    <div class="">
      Duration: <strong>{durationFormatter($showForm.duration * 60)}</strong>
    </div>
  </RangeSlider>

  <button
    class="neon-primary variant-soft-primary btn btn-lg text-xl !font-bold"
    disabled={$delayed}
    type="submit"
  >
    {#if $delayed}
      <Icon icon="eos-icons:loading" />{/if}
    Create Show</button
  >

  <!--HIDDEN INPUTS-->
  <input type="hidden" name="capacity" value="1" />
</form>
