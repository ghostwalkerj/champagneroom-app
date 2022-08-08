<script lang="ts">
	import type { AgentDocument } from '$lib/ORM/models/agent';

	export let agent: AgentDocument;
</script>

<div class="bg-primary text-primary-content w-full card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">My Wallet</h2>

		<div class="bg-primary text-primary-content stats">
			<div class="stat">
				<div class="stat-title">Account balance</div>
				<div class="stat-value">$89,400</div>
				<div class="stat-actions">
					<button class="btn btn-sm btn-success">Add funds</button>
				</div>
			</div>

			<div class="stat">
				<div class="stat-title">Current balance</div>
				<div class="stat-value">$89,400</div>
				<div class="stat-actions">
					<button class="btn btn-sm">Withdrawal</button>
					<button class="btn btn-sm">deposit</button>
				</div>
			</div>
		</div>
	</div>
</div>
