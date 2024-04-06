<script lang="ts">
  import {
    type Infer,
    superForm,
    type SuperValidated
  } from 'sveltekit-superforms';

  import type { agentSignupSchema } from '$lib/models/agent';

  export let agentForm: SuperValidated<Infer<typeof agentSignupSchema>>;

  const { form, errors, constraints, enhance, delayed, message } =
    superForm(agentForm);
</script>

<form action="?/create_agent" method="post" use:enhance>
  {#if message}
    <div
      class="status"
      class:error={$message.status >= 400}
      class:success={$message.status || $message.status < 300}
    >
      {$message.text}
    </div>
  {/if}

  <input
    class="input"
    title="Stage Name"
    type="text"
    placeholder={exampleName}
    bind:value={$form.name}
  />
</form>
