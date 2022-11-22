<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_MOBILE_PATH } from '$env/static/public';
	import ConnectButton from '$lib/components/header/ConnectButton.svelte';
	import { browserType } from '$lib/stores';
	import { UAParser } from 'ua-parser-js';
	import urlJoin from 'url-join';

	if (browser) {
		if ($browserType == null) {
			const parser = new UAParser();
			let result = parser.getDevice();
			browserType.set(result.type);
		}

		if ($browserType == 'mobile') {
			const mobileUrl = urlJoin($page.url.origin, PUBLIC_MOBILE_PATH, $page.url.pathname);
			goto(mobileUrl);
		}
	}
</script>

{#if $browserType != 'mobile'}
	<div class="bg-base-100 navbar">
		<div class="flex-1">
			<!-- svelte-ignore a11y-missing-attribute -->
			<a class="text-xl btn btn-ghost normal-case">
				<img src="/logo.png" alt="Logo" width="48" /></a
			>
		</div>
		<div class="flex-none">
			<ConnectButton />
		</div>
	</div>

	<div class="h-full">
		<slot />
	</div>
{/if}
