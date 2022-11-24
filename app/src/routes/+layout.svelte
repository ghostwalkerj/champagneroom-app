<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_MOBILE_PATH } from '$env/static/public';
	import { browserType } from '$lib/stores';
	import { UAParser } from 'ua-parser-js';
	import urlJoin from 'url-join';
	import '../app.css';

	const mobilePath = $page.url.pathname.startsWith(PUBLIC_MOBILE_PATH);

	if (!mobilePath) {
		if (browser) {
			if ($browserType == null) {
				const parser = new UAParser();
				let result = parser.getDevice();
				browserType.set(result.type);
			}

			if ($browserType == 'mobile' || $browserType == 'tablet') {
				const mobileUrl = urlJoin($page.url.origin, PUBLIC_MOBILE_PATH, $page.url.pathname);
				goto(mobileUrl);
			}
		}
	}
</script>

{#if mobilePath}
	<slot />
{:else if browser}
	{#if $browserType != 'mobile' && $browserType != 'tablet'}
		<slot />
	{/if}{/if}
