<script lang="ts">
	import { onMount } from 'svelte';
	export let address: string;
	let diameter = 20;
	$: hash = parseInt(address.slice(2, 10), 16);
	let container: HTMLDivElement;
	let jazzicon: { default: (arg0: number, arg1: number) => any };
	let identicon: HTMLDivElement;
	onMount(async () => {
		jazzicon = await import('@metamask/jazzicon');
		identicon = jazzicon.default(diameter, hash);
		container.appendChild(identicon);
	});

	$: if (jazzicon) {
		const newIdenticon = jazzicon.default(diameter, hash);
		container.replaceChild(newIdenticon, identicon);
		identicon = newIdenticon;
	}
</script>

<div bind:this={container} />
