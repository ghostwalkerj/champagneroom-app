<script lang="ts">
  import { possessive } from 'i18n-possessive';
  import urlJoin from 'url-join';

  import { applyAction, enhance } from '$app/forms';

  import type { ShowDocumentType } from '$lib/models/show';

  import Config from '$lib/config';
  import { durationFormatter } from '$lib/constants';

  import type { CreatorDocument } from '$lib/models/creator';
  import type { ActionData } from './$types';

  $: showDuration = 60;

  export let creator: CreatorDocument;
  export let form: ActionData;
  export let isLoading = false;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCreated: (show: ShowDocumentType) => void;

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
            Config.Path.show,
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
</script>

<div class="bg-primary text-primary-content card">
  <div class="text-center card-body items-center p-3">
    <h2 class="text-2xl card-title">Create a New Show</h2>
    <div class="flex flex-col w-full">
      <form method="post" action="?/create_show" use:enhance={onSubmit}>
        <div
          class="flex flex-col lg:flex-row text-white p-2 justify-center items-center gap-4"
        >
          <div class="form-control flex-grow">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="label">
              <span class="label-text">Title</span>
            </label>
            <input
              type="text"
              name="name"
              class="daisy-input daisy-input-bordered daisy-input-primary"
              bind:value={showName}
              minlength="3"
              maxlength="50"
            />
            {#if form?.badName}
              <div class="shadow-lg alert alert-error">
                Show Name should be between 3 and 50 characters
              </div>
            {/if}
          </div>

          <div class="form-control lg:w-40">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label for="price" class="label">
              <span class="label-text">Ticket Price in USD</span></label
            >
            <div class="rounded-md shadow-sm relative">
              <div
                class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
              >
                <span class="text-gray-500 sm:text-sm"> $ </span>
              </div>
              <input
                type="text"
                name="price"
                class="w-full py-2 pl-6 input daisy-input-bordered daisy-input-primary"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={form?.price ?? ''}
              />
              <div
                class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
              >
                <span class="text-gray-500 sm:text-sm" id="price-currency">
                  USD
                </span>
              </div>
            </div>
            {#if form?.missingPrice}
              <div class="shadow-lg alert alert-error whitespace-nowrap">
                Price is required
              </div>
            {/if}
            {#if form?.invalidPrice}
              <div class="shadow-lg alert alert-error whitespace-nowrap">
                Invalid Price
              </div>
            {/if}
          </div>

          <input type="hidden" name="capacity" value="1" />

          <input
            type="hidden"
            name="coverImageUrl"
            value={creator.user.profileImageUrl}
          />
          <div class="form-control lg:w-1/5">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="label">
              <span class="label-text whitespace-nowrap"
                >Duration ({durationFormatter(showDuration * 60)})</span
              >
            </label>
            <input
              type="range"
              min="15"
              max="120"
              bind:value={showDuration}
              class="range"
              step="15"
              name="duration"
            />
            <div class="w-full flex justify-between text-xs px-2">
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
            </div>
          </div>
        </div>

        <div class="py-2">
          <button
            class="daisy-btn daisy-btn-secondary"
            type="submit"
            disabled={isLoading}>Create Show</button
          >
        </div>
      </form>
    </div>
  </div>
</div>
