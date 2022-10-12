<script lang="ts">
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import { currencyFormatter } from '$lib/util/constants';
	import Chart from 'chart.js/auto';
	import ChartDataLabels from 'chartjs-plugin-datalabels';
	import spacetime from 'spacetime';
	import { Doughnut } from 'svelte-chartjs';

	export let talents: TalentDocument[];

	const now = spacetime.now();
	let labels = [] as string[];
	let talentData = [] as number[];

	if (talents) {
		talents.forEach(async (talent: TalentDocument) => {
			const range = { start: now.startOf('month').epoch, end: now.endOf('month').epoch };
			const stats = await talent.getStatsByRange(range);
			if (stats.totalEarnings > 0) {
				talentData = talentData.concat(stats.totalEarnings);
				labels = labels.concat(talent.name);
			}
		});
	}

	const options = {
		responsive: true,
		circumference: 180,
		rotation: -90,
		animation: {
			animateScal: true
		},
		plugins: {
			legend: { display: true, position: 'bottom' },
			datalabels: {
				formatter: function (value: number | bigint) {
					return currencyFormatter.format(value);
				}
				//anchor: 'end'
			}
		}
	};

	$: data = {
		labels,
		datasets: [
			{
				data: talentData,
				backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30', '#20134E'],
				borderWidth: 0
			}
		]
	};
	Chart.register(ChartDataLabels);
</script>

<div class="bg-primary text-primary-content  card">
	<div class="text-center card-body items-center">
		<div class="text-2xl card-title capitalize">
			Top Talent - {now.monthName()}
		</div>
		{#if talents && talents.length != 0}
			{#if talentData.length > 0}
				{#key talentData}
					<Doughnut {data} {options} />
				{/key}
			{:else}
				<div class="text-center">
					<h3 class="text-lg">No earnings available</h3>
				</div>
			{/if}
		{:else}
			<h3 class="text-xl">No talents found</h3>
		{/if}
	</div>
</div>
