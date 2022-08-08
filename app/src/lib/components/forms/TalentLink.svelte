<script lang="ts">
	import { TALENT_PATH } from '$lib/constants';
	export let row;
</script>

<div class="flex space-x-3">
	<a href="/{TALENT_PATH}/{row.url}">{row.name}</a>
	<button class="btn btn-secondary btn-xs">Reset</button>
</div>
