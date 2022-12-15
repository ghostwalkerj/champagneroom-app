<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from 'framework7-svelte';

  let dispatch = createEventDispatcher();
</script>

<Button
  round
  fill
  on:click={() => {
    dispatch('click');
  }}
>
  <slot>Continue</slot>
</Button>
