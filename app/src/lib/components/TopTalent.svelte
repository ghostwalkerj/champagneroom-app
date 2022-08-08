<script lang="ts">
	import type { AgentDocument } from '$lib/ORM/models/agent';
	export let agent: AgentDocument;
	const month = new Date().toLocaleString('default', { month: 'long' });
</script>

<div class="bg-primary text-primary-content w-full card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Top Talent - {month}</h2>

		<div class="text-white text-left whitespace-nowrap" />
	</div>
</div>
