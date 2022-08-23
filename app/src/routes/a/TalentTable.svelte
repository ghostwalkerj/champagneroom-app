<script lang="ts">
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { currencyFormatter } from '$lib/util/constants';
	import SvelteTable from 'svelte-table';
	import TableCopyLink from './TableCopyLink.svelte';
	import TableRating from './TableRating.svelte';

	export let talents: TalentDocument[];

	type TalentRow = {
		name: string;
		photo: string;
		rating: number;
		calls: number;
		earnings: number;
		commission: number;
		myEarnings: number;
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
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			renderComponent: {
				component: TableRating,
				props: {
					//onChange: updateRow
				}
			}
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
			key: 'commission',
			title: 'Commission (%)',
			value: (v: TalentRow) => v.commission,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			renderValue: (v: TalentRow) => `${v.commission}%`
		},
		{
			key: 'myearnings',
			title: 'Commision ($)',
			value: (v: TalentRow) => v.myEarnings,
			sortable: true,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			renderValue: (v: TalentRow) => currencyFormatter.format(v.myEarnings)
		},
		{
			key: 'url',
			title: 'Talent Link',
			value: (v: TalentRow) => v.url,
			sortable: false,
			headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
			// renderValue: (v: TalentRow) => `<a href="/${TALENT_PATH}/${v.url}">${v.name}</a>`
			renderComponent: {
				component: TableCopyLink
			}
		}
		// {
		// 	key: 'action',
		// 	title: '',
		// 	sortable: false,
		// 	headerClass: 'font-semibold text-left text-sm py-3.5 px-3 text-gray-900',
		// 	renderValue: () => '<button class="btn btn-secondary btn-xs">Edit</button>'
		// }
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
				url: talent.key,
				commission: talent.agentCommission,
				myEarnings: stats.totalEarnings * (1 / talent.agentCommission)
			});
		});
	}
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Manage Talent</h2>
	</div>
	<div class="p-2">
		<SvelteTable
			{columns}
			rows={talentRows}
			classNameTable="w-full bg-white  rounded-xl"
			classNameTbody="divide-y border-3 rounded-xl"
			classNameCell="text-sm py-4 px-3 m-10 text-gray-500 whitespace-nowrap "
		/>
	</div>
</div>
