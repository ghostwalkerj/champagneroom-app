<script lang="ts">
	import jazzicon from 'jazzicon-ts';
	import { onMount } from 'svelte';
	export let address: string;
	let diameter = 20;
	let container: HTMLDivElement;
	$: hash = parseInt(address.slice(2, 10), 16);
	let jazziconImport: { default: (arg0: number, arg1: number) => any };
	let jazzicon: HTMLDivElement;

	onMount(async () => {
		jazziconImport = await import('@metamask/jazzicon');
		jazzicon = jazziconImport.default(diameter, hash);
		container.appendChild(jazzicon);
	});

	if (jazziconImport) {
		jazzicon = jazziconImport.default(diameter, hash);
		console.log(jazzicon);
	}
</script>

{jazzicon}
<div bind:this={container} />
