<script lang="ts">
	import type { AgentDocument } from '$lib/ORM/models/agent';
	import { Doughnut } from 'svelte-chartjs';
	import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	export let agent: AgentDocument;
	export let talents: TalentDocument[];

	const month = new Date().toLocaleString('default', { month: 'long' });
	let labels = [] as string[];

	if (talents) {
		labels = talents.map((talent) => talent.name);
	}

	const options = {
		responsive: true,
		circumference: 180,
		rotation: -90,
		animation: {
			animateScal: true
		},
		plugins: {
			legend: { display: true, position: 'bottom' }
		}
	};

	const data = {
		labels,
		datasets: [
			{
				data: [300, 50, 100],
				backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30'],
				borderWidth: 0
			}
		]
	};
	ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);
</script>

<div class="bg-primary text-primary-content  card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Top Talent - {month}</h2>
		<Doughnut {data} {options} />
	</div>
</div>
