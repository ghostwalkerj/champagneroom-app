<script lang="ts">
	import { currencyFormatter } from '$lib/constants';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	export let talents: TalentDocument[];
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="card-title">Manage Talent</h2>
	</div>
	<table class="divide-y min-w-full divide-gray-300">
		<thead class="bg-gray-50">
			<tr>
				<th
					scope="col"
					class="font-semibold text-left text-sm py-3.5 pr-3 pl-4 text-gray-900 sm:pl-6">Name</th
				>
				<th scope="col" class="font-semibold text-left text-sm py-3.5 px-3 text-gray-900"
					>Avg Rating</th
				>
				<th scope="col" class="font-semibold text-left text-sm py-3.5 px-3 text-gray-900"
					>Completed Calls</th
				>
				<th scope="col" class="font-semibold text-left text-sm py-3.5 px-3 text-gray-900"
					>Total Earnings</th
				>
				<th scope="col" class="font-semibold text-left text-sm py-3.5 px-3 text-gray-900"
					>Private Link</th
				>
			</tr>
		</thead>
		<tbody class="divide-y bg-white divide-gray-200">
			{#if talents && talents.length > 0}
				{#each talents as talent}
					<tr>
						<td class="text-sm py-4 pr-3 pl-4 whitespace-nowrap sm:pl-6">
							<div class="flex items-center">
								<div
									class="bg-cover bg-no-repeat bg-center rounded-full h-10 w-10"
									style="background-image: url('{talent.profileImageUrl}')"
								/>
								<div class="ml-4">
									<div class="font-medium text-gray-900">{talent.name}</div>
								</div>
							</div>
						</td>
						{#await talent.getStats()}
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap"> 0 </td>
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap"> 0 </td>
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
								{currencyFormatter.format(0)}
							</td>
						{:then stats}
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
								{stats.ratingAvg}
							</td>
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
								{stats.completedCalls.length}
							</td>
							<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
								{currencyFormatter.format(stats.totalEarnings)}
							</td>
						{/await}
						<td class="text-sm py-4 px-3 text-gray-500 whitespace-nowrap">
							<a href="/t/{talent.key}">{talent.name}</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
