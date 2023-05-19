<script>
	import { goto } from '$app/navigation';

	export let title = '';
	export let path = '';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="cursor-pointer flex flex-col text-gray-300 w-16 items-center group  hover:text-white"
	on:click={() => goto(path)}
>
	<div class="h-8 mb-1 hover:text-white group-hover:animate-bounce">
		<slot />
	</div>
	<p class="tracking-widest opacity-0 whitespace-nowrap hover:text-white group-hover:opacity-100">
		{title}
	</p>
</div>
