<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="h-full flex flex-col justify-center items-center gap-4">
    <h1 class="text-3xl font-semibold">Something went wrong</h1>
    <pre>Error description: {$page.status} {$page.error?.message}</pre>
    <a href="/app" class="btn variant-filled-primary">Go back to app</a>

</div>