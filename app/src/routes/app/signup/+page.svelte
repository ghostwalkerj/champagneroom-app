<script lang="ts">
  import { goto } from '$app/navigation';
  import Config from '$lib/config';
</script>

<div class="flex place-content-center w-full flex-col text-center">
  <div class="text-3xl font-bold m-10 text-primary">Join Our Community</div>
  <div
    class="flex w-full flex-col place-items-center place-content-center md:flex-row"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="daisy-btn btn-primary w-fit"
      on:click={() => goto(Config.Path.creatorSignup)}
    >
      Become a Creator
    </div>

    <div class="divider divider-vertical text-primary">OR</div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="daisy-btn btn-secondary w-fit"
      on:click={() => goto(Config.Path.agentSignup)}
    >
      Become an Agent
    </div>
  </div>
</div>
