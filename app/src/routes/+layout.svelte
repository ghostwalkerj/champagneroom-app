<script lang="ts">
	import { browser } from '$app/environment';
	import 'virtual:windi.css';
	if (browser) import('virtual:windi-devtools');
</script>

<slot />
