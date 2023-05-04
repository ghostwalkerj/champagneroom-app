<script lang="ts">
  import { enhance } from '$app/forms';
  import type { AgentDocument } from '$lib/ORM/models/agent';
  import type { ActionData } from './$types';

  export let agent: AgentDocument;
  export let form: ActionData;
</script>

<div class="bg-primary h-full text-primary-content w-full card">
  <div class="text-center card-body items-center">
    <h2 class="text-2xl card-title">Add New Talent</h2>

    <div class="text-white text-left whitespace-nowrap">
      <form method="post" action="?/create_talent" use:enhance>
        <div class="max-w-xs py-2 form-control">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="label">
            <span class="label-text">Talent Name</span>
          </label>
          <input type="hidden" name="agentId" value={agent._id} />
          <input
            type="text"
            name="name"
            placeholder="Enter a name"
            class="max-w-xs py-2 input input-bordered input-primary"
            value={form?.name ?? ''}
            minlength="3"
            maxlength="50"
          />
        </div>
        {#if form?.badName}
          <div class="shadow-lg alert alert-error">
            Name should be between 3 and 50 characters
          </div>
        {/if}

        <label for="price" class="label">
          <span class="label-text">Commission (%)</span></label
        >
        <div class="form-control">
          <!-- svelte-ignore a11y-label-has-associated-control -->

          <div class="rounded-md shadow-sm mt-1 w-20 relative">
            <input
              type="text"
              name="agentCommission"
              class="py-2 w-20 input input-bordered input-primary"
              value={form?.agentCommission ?? '10'}
            />
            <div class="flex inset-y-4 right-4 absolute pointer-events-none">
              <span class="text-gray-500 sm:text-sm"> % </span>
            </div>
          </div>
        </div>
        {#if form?.badAgentCommission}
          <div class="shadow-lg alert alert-error">
            Commission should be between 0 and 100.
          </div>
        {/if}
        <div class="py-4">
          <button class="btn btn-secondary" type="submit">Save</button>
        </div>
      </form>
    </div>
  </div>
</div>
