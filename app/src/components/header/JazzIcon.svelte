<script lang="ts">
	import { onMount } from 'svelte';
	export let address: string;
	let diameter = 20;
	$: hash = Number.parseInt(address.slice(2, 10), 16);
	let container: HTMLDivElement;
	let jazzicon: { default: (argument0: number, argument1: number) => any };
	let identicon: HTMLDivElement;
	onMount(async () => {
		jazzicon = await import('@metamask/jazzicon');
		identicon = jazzicon.default(diameter, hash);
		container.append(identicon);
	});

	$: if (jazzicon) {
		const newIdenticon = jazzicon.default(diameter, hash);
		identicon.replaceWith(newIdenticon);
		identicon = newIdenticon;
	}
</script>

<div bind:this={container} />
