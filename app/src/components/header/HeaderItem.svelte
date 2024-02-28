<script>
  import { goto } from '$app/navigation';

  export let path = '';
  export let title = '';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="group flex w-16 cursor-pointer flex-col items-center text-gray-300 hover:text-white"
  on:click={() => goto(path)}
>
  <div class="mb-1 h-8 hover:text-white group-hover:animate-bounce">
    <slot />
  </div>
  <p
    class="whitespace-nowrap tracking-widest opacity-0 hover:text-white group-hover:opacity-100"
  >
    {title}
  </p>
</div>
