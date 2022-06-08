<script lang="ts">
	import { browser } from '$app/env';
	import 'virtual:windi.css';

	if (browser) {
		(window as any).global = window;
		(window as any).process = {
			env: { DEBUG: undefined }
		};
		import('virtual:windi-devtools');
	}
</script>

<slot />
