<script lang="ts">
	import { browser } from '$app/env';
	export let address: string;
	let diameter = 20;
	let container: HTMLDivElement;

	if (browser) {
		import('@metamask/jazzicon').then((jazzicon) => {
			container.appendChild(jazzicon.default(diameter, parseInt(address.slice(2, 10), 16)));
		});
	}
</script>

{#if address}
	<div bind:this={container} />
{/if}
