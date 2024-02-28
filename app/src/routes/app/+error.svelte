<script lang="ts">
  import { page } from '$app/stores';
</script>

<div
  class="bg-custom flex h-full flex-col items-center justify-center gap-4 rounded p-8"
>
  <h1 class="text-3xl font-semibold">Something went wrong</h1>
  <pre>Error description: {$page.status} {$page.error?.message}</pre>
  <a href="/app" class="neon-primary variant-soft-primary btn">Go back to app</a
  >
</div>
