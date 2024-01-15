<script lang="ts">
  import { possessive } from 'i18n-possessive';
  import urlJoin from 'url-join';

  import { applyAction, enhance } from '$app/forms';

  import type { ShowDocument } from '$lib/models/show';

  import Config from '$lib/config';
  import { durationFormatter } from '$lib/constants';

  import type { CreatorDocument } from '$lib/models/creator';
  import type { ActionData } from './$types';

  import { RangeSlider } from '@skeletonlabs/skeleton';
  import { superForm } from 'sveltekit-superforms/client';

  $: showDuration = 60;

  export let createShowForm;
  export let creator: CreatorDocument;
  export let form: ActionData;
  export let isLoading = false as boolean;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCreated: (show: ShowDocument) => void;

  let showName = creator
    ? possessive(creator.user.name, 'en') + ' Show'
    : 'Show';

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }) => {
      switch (true) {
        case result.data.showCreated: {
          const showUrl = urlJoin(
            window.location.origin,
            Config.PATH.show,
            result.data.show!._id.toString()
          );
          navigator.clipboard.writeText(showUrl);
          onShowCreated(result.data.show);
          break;
        }
      }
      await applyAction(result);
      isLoading = false;
    };
  };

  const {
    form: showForm,
    errors,
    constraints,
    delayed
  } = superForm(createShowForm, {
    validationMethod: 'submit-only'
  });
</script>

<form
  method="post"
  action="?/create_show"
  use:enhance={onSubmit}
  class="bg-custom rounded p-4 flex flex-col gap-4"
>
  <h2 class="text-lg font-semibold">Create Show</h2>

  <div class="grid lg:grid-cols-2 gap-4">
    <label for="">
      <span>Title</span>
      <input
        type="text"
        name="name"
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
          bind:value={$showForm.price}
          {...$constraints.price}
        />
      </div>
      {#if $errors.price}<span class="text-error">{$errors.price}</span>{/if}
    </label>
  </div>

  <RangeSlider
    name="duration"
    accent={'accent-primary'}
    bind:value={$showForm.duration}
    min={15}
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

  <input
    type="hidden"
    name="coverImageUrl"
    value={creator.user.profileImageUrl}
  />
</form>
