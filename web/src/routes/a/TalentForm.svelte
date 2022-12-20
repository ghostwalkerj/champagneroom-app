<script lang="ts">
  import type { AgentDocument } from '$lib/ORM/models/agent';
  import type { TalentDocument } from '$lib/ORM/models/talent';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';

  export let agent: AgentDocument;
  export let talents: TalentDocument[];

  const { form, errors, handleReset, handleChange, handleSubmit } = createForm({
    initialValues: { name: '', agentCommission: '10' },
    validationSchema: yup.object({
      name: yup.string().required('Talent name is required'),
      agentCommission: yup
        .number()
        .min(0)
        .max(100)
        .integer()
        .required('Agent commission between 0 and 100 required'),
    }),
    onSubmit: async values => {
      const talent = await agent.createTalent(
        values.name,
        Number.parseInt(values.agentCommission)
      );
      handleReset();
      talents = talents.concat([talent]);
    },
  });
</script>

<div class="bg-primary h-full text-primary-content w-full card">
  <div class="text-center card-body items-center">
    <h2 class="text-2xl card-title">Add New Talent</h2>

    <div class="text-white text-left whitespace-nowrap">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="max-w-xs  py-2 form-control">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="label">
            <span class="label-text">Talent Name</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter a name"
            class="max-w-xs  py-2 input input-bordered input-primary"
            on:change={handleChange}
            bind:value={$form.name}
          />
        </div>
        {#if $errors.name}
          <div class="shadow-lg alert alert-error">{$errors.name}</div>
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
              bind:value={$form.agentCommission}
              on:change={handleChange}
            />
            <div class="flex  inset-y-4 right-4 absolute pointer-events-none">
              <span class="text-gray-500 sm:text-sm"> % </span>
            </div>
          </div>
        </div>
        {#if $errors.agentCommission}
          <div class="shadow-lg alert alert-error">
            {$errors.agentCommission}
          </div>
        {/if}
        <div class="py-4">
          <button class="btn btn-secondary" type="submit">Save </button>
        </div>
      </form>
    </div>
  </div>
</div>
