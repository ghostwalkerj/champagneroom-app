<script lang="ts">
	import { writable } from 'svelte/store';
	import { currencyFormatter } from '$lib/constants';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import {
		type ColumnDef,
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		type TableOptions,
		getSortedRowModel
	} from '@tanstack/svelte-table';

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

	const defaultColumns: ColumnDef<TalentRow>[] = [
		{
			accessorKey: 'name',
			header: () => 'Name',
			footer: (info) => info.column.id
		},
		{
			accessorKey: 'photo',
			header: () => 'Photo',
			footer: (info) => info.column.id
		},
		{
			accessorKey: 'rating',
			header: () => 'Rating',
			footer: (info) => info.column.id
		},
		{
			accessorKey: 'calls',
			header: () => 'Calls',
			footer: (info) => info.column.id
		},
		{
			accessorKey: 'earnings',
			header: () => 'Earnings',
			footer: (info) => info.column.id
		},
		{
			accessorKey: 'url',
			header: () => 'URL',
			footer: (info) => info.column.id
		}
	];

	let sorting = [];

	const setSorting = (updater) => {
		if (updater instanceof Function) {
			sorting = updater(sorting);
		} else {
			sorting = updater;
		}
		options.update((old) => ({
			...old,
			state: {
				...old.state,
				sorting
			}
		}));
	};

	const options = writable<TableOptions<TalentRow>>({
		data: talentRows,
		columns: defaultColumns,
		state: {
			sorting
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const table = createSvelteTable(options);

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
			options.update((options) => ({
				...options,
				data: talentRows
			}));
		});
	}
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="card-title">Manage Talent</h2>
	</div>
	<table class="divide-y min-w-full divide-gray-300">
		<thead class="bg-gray-50">
			{#each $table.getHeaderGroups() as headerGroup}
				<tr>
					{#each headerGroup.headers as header}
						<th
							scope="col"
							class="font-semibold text-left text-sm py-3.5 pr-3 pl-4 text-gray-900 sm:pl-6"
						>
							{#if !header.isPlaceholder}
								<div
									class:cursor-pointer={header.column.getCanSort()}
									class:select-none={header.column.getCanSort()}
									on:click={header.column.getToggleSortingHandler()}
								>
									<svelte:component
										this={flexRender(header.column.columnDef.header, header.getContext())}
									/>
									{{
										asc: ' 🔼',
										desc: ' 🔽'
									}[header.column.getIsSorted().toString()] ?? ''}
								</div>
							{/if}
						</th>
					{/each}
				</tr>
			{/each}
		</thead>
		<tbody class="divide-y bg-white divide-gray-200">
			{#each $table.getRowModel().rows as row}
				<tr>
					{#each row.getVisibleCells() as cell}
						<td class="text-sm py-4 pr-3 pl-4 whitespace-nowrap sm:pl-6">
							<svelte:component this={flexRender(cell.column.columnDef.cell, cell.getContext())} />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
