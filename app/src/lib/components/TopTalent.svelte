<script lang="ts">
	import type { AgentDocument } from '$lib/ORM/models/agent';
	import { Doughnut } from 'svelte-chartjs';
	import Chart from 'chart.js/auto';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import ChartDataLabels from 'chartjs-plugin-datalabels';
	import { currencyFormatter } from '$lib/constants';

	export let agent: AgentDocument;
	export let talents: TalentDocument[];

	const month = new Date().toLocaleString('default', { month: 'long' });
	let labels = [] as string[];
	let _data = [] as number[];
	if (talents) {
		labels = talents.map((talent: TalentDocument) => talent.name);
		talents.forEach(async (talent: TalentDocument) => {
			const stats = await talent.getStats();
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
				formatter: function (value, context) {
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
				data: [3000, 500, 1000],
				backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30'],
				borderWidth: 0
			}
		]
	};
	Chart.register(ChartDataLabels);
</script>

<div class="bg-primary text-primary-content  card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Top Talent - {month}</h2>
		{#if talents && talents.length != 0}
			<Doughnut {data} {options} />
		{:else}
			<h3 class="text-xl">No talents found</h3>
		{/if}
	</div>
</div>
