<script lang="ts">
	import { writable } from 'svelte/store';
	import { currencyFormatter } from '$lib/constants';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import SvelteTable from 'svelte-table';

	export let talents: TalentDocument[];

	type TalentRow = {
		name: string;
		photo: string;
		rating: number;
		calls: number;
		earnings: number;
		url: string;
	};

	let talentRows: TalentRow[] = [];

	const columns = [
		{
			key: 'name',
			title: 'Name',
			value: (v: TalentRow) => v.name,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 pr-3 pl-4 text-gray-900 sm:pl-6',
			class: 'text-sm py-4 pr-3 pl-4 whitespace-nowrap sm:pl-6',
			renderValue: (v: TalentRow) =>
				`<div class="flex items-center">
						<div class="bg-cover bg-no-repeat bg-center rounded-full h-10 w-10"
								style="background-image: url('${v.photo}')"></div>
						<div class="ml-4">
								<div class="font-medium text-gray-900">${v.name}</div>
						</div>
				</div>`
		},
		{
			key: 'rating',
			title: 'Average Rating',
			value: (v: TalentRow) => v.rating,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900'
		},
		{
			key: 'calls',
			title: 'Calls',
			value: (v: TalentRow) => v.calls,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900'
		},
		{
			key: 'earnings',
			title: 'Earnings',
			value: (v: TalentRow) => v.earnings,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			renderValue: (v: TalentRow) => currencyFormatter.format(v.earnings)
		},
		{
			key: 'url',
			title: 'Private Link',
			value: (v: TalentRow) => v.url,
			sortable: false,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			renderValue: (v: TalentRow) => `<a href="/t/${v.url}">${v.name}</a>`
		}
	];

	if (talents) {
		talents.forEach(async (talent: TalentDocument) => {
			const stats = await talent.getStats();
			talentRows = talentRows.concat({
				name: talent.name,
				photo: talent.profileImageUrl,
				rating: stats.ratingAvg,
				calls: stats.completedCalls.length,
				earnings: stats.totalEarnings,
				url: talent.key
			});
		});
	}
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="card-title">Manage Talent</h2>
	</div>
	<SvelteTable
		{columns}
		rows={talentRows}
		classNameTable="divide-y min-w-full divide-gray-300"
		classNameThead="bg-gray-50"
		classNameTbody="divide-y bg-white divide-gray-200"
		classNameCell="text-sm py-4 px-3 text-gray-500 whitespace-nowrap"
	/>

	<!-- <table class="divide-y min-w-full divide-gray-300">
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
				{#each talentRows as talent}
					<tr>
						<td class="text-sm py-4 pr-3 pl-4 whitespace-nowrap sm:pl-6">
							<div class="flex items-center">
								<div
									class="bg-cover bg-no-repeat bg-center rounded-full h-10 w-10"
									style="background-image: url('{talent.photo}')"
								/>
								<div class="ml-4">
									<div class="font-medium text-gray-900">{talent.name}</div>
								</div>
							</div>
						</td>

						<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
							{talent.rating}
						</td>
						<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
							{talent.calls}
						</td>
						<td class="text-sm text-center py-4 px-3 text-gray-500 whitespace-nowrap">
							{currencyFormatter.format(talent.earnings)}
						</td>
						<td class="text-sm py-4 px-3 text-gray-500 whitespace-nowrap">
							<a href="/t/{talent.url}">{talent.name}</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table> -->
</div>
