<script lang="ts">
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { UAParser } from 'ua-parser-js';
	import urlJoin from 'url-join';

	if (browser) {
		const parser = new UAParser();
		const result = parser.getDevice();

		if (result && result.type == 'mobile') {
			import.meta.env.VITE_MOBILE_PATH;
			const mobileUrl = urlJoin(
				$page.url.origin,
				import.meta.env.VITE_MOBILE_PATH,
				$page.url.pathname
			);
			goto(mobileUrl);
		}
	}
</script>

<div class="h-full">
	<slot />
</div>
