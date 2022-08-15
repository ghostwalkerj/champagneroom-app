<script lang="ts">
	import type { AgentDocument } from '$lib/ORM/models/agent';
	import { Doughnut } from 'svelte-chartjs';
	import Chart from 'chart.js/auto';
	import type { TalentDocument, TalentStats } from '$lib/ORM/models/talent';
	import ChartDataLabels from 'chartjs-plugin-datalabels';
	import { currencyFormatter } from '$lib/constants';
	import spacetime from 'spacetime';

	export let agent: AgentDocument;
	export let talents: TalentDocument[];

	const now = spacetime.now();
	let labels = [] as string[];
	let talentData = [] as number[];

	if (talents) {
		labels = talents.map((talent: TalentDocument) => talent.name);
		talents.forEach(async (talent: TalentDocument) => {
			const stats = await talent.getStats({
				start: now.startOf('month').epoch,
				end: now.endOf('month').epoch
			});
			talentData.push(stats.totalEarnings);
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

	const data = {
		labels,
		datasets: [
			{
				data: talentData,
				backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30'],
				borderWidth: 0
			}
		]
	};
	Chart.register(ChartDataLabels);
</script>

<div class="bg-primary text-primary-content  card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title capitalize">Top Talent - {now.monthName()}</h2>
		{#if talents && talents.length != 0}
			{#if talentData.length > 0}
				<Doughnut {data} {options} />
			{:else}
				<div class="text-center">
					<h3 class="text-lg">No data available</h3>
				</div>
			{/if}
		{:else}
			<h3 class="text-xl">No talents found</h3>
		{/if}
	</div>
</div>
