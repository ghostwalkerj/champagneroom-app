<script lang="ts">
  import { possessive } from 'i18n-possessive';
  import urlJoin from 'url-join';

  import type { ShowDocument, showZodSchema } from '$lib/models/show';

  import Config from '$lib/models/config';
  import { durationFormatter } from '$lib/constants';

  import type { CreatorDocument } from '$lib/models/creator';

  import { RangeSlider } from '@skeletonlabs/skeleton';
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperValidated } from 'sveltekit-superforms';

  export let createShowForm: SuperValidated<typeof showZodSchema>;
  export let creator: CreatorDocument;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCreated: (show: ShowDocument) => void;

  let showName = creator
    ? possessive(creator.user.name, 'en') + ' Show'
    : 'Show';

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
              Config.PATH.show,
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
  class="bg-custom rounded p-4 flex flex-col gap-4"
>
  <h2 class="text-lg font-semibold">Create Show</h2>

  <div class="grid lg:grid-cols-2 gap-4">
    <label for="">
      <span>Title</span>
      <input
        type="text"
        name="name"
        placeholder={showName}
        bind:value={$showForm.name}
        {...$constraints.name}
        class="input variant-form-material bg-surface-700"
      />
      {#if $errors.name}<span class="text-error">{$errors.name}</span>{/if}
    </label>

    <label for="">
      <span>Ticket Price (In USD)</span>
      <div
        class="input-group input-group-divider grid-cols-[auto_1fr] variant-form-material bg-surface-700"
      >
        <div class="input-group-shim text-surface-300 font-semibold">USD</div>
        <input
          type="number"
          name="price"
          bind:value={$showForm.price.amount}
          {...$constraints.price?.amount}
        />
      </div>
      {#if $errors.price?.amount}<span class="text-error"
          >{$errors.price.amount}</span
        >{/if}
    </label>
  </div>

  <RangeSlider
    name="duration"
    accent={'accent-primary'}
    bind:value={$showForm.duration}
    min={0}
    max={120}
    step={15}
    ticked
  >
    <div class="">
      Duration: <strong>{durationFormatter($showForm.duration * 60)}</strong>
    </div>
  </RangeSlider>

  <button
    class="btn variant-soft-primary !font-bold btn-lg text-xl neon-primary"
    disabled={!delayed}>Create Show</button
  >

  <!--HIDDEN INPUTS-->
  <input type="hidden" name="capacity" value="1" />
</form>
