<script lang="ts">
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import spacetime from 'spacetime';
  import { Line } from 'svelte-chartjs';

  import type { CreatorDocument } from '$lib/models/creator';

  export let creators: CreatorDocument[];

  const now = spacetime.now();
  let labels = [] as string[];
  let creatorData = [] as number[];

  if (creators) {
    creators.forEach(async (creator: CreatorDocument) => {
      const range = {
        start: now.startOf('month').epoch,
        end: now.endOf('month').epoch
      };
      const stats = await creator.getStatsByRange(range);
      if (stats.totalEarnings > 0) {
        creatorData = creatorData.concat(stats.totalEarnings);
        labels = labels.concat(creator.user.name);
      }
    });
  }

  const options = {
    elements: {
      line: {
        borderColor: '#58C7F3',
        tension: 0.4
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      }
    },
    legend: {
      labels: {
        usePointStyle: true, // show legend as point instead of box
        fontSize: 10 // legend point size is based on fontsize
      }
    }
  };

  $: data = {
    type: 'line',
    labels: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    datasets: [
      {
        label: 'Weekly Bookings',
        data: [2, 3, 1, 2, 4, 5, 2],
        borderWidth: 2,
        pointBorderColor: '#E779C1',
        pointBorderWidth: 1,
        pointStyle: 'circle',
        pointRadius: 10,
        pointHoverRadius: 15
      }
    ]
  };
  Chart.register(ChartDataLabels);
</script>

<div class="bg-primary text-primary-content card">
  <div class="text-center card-body items-center">
    <div class="text-2xl card-title capitalize">Weekly Bookings</div>
    {#if creators && creators.length > 0}
      {#if creatorData.length > 0}
        {#key creatorData}
          <Line {data} {options} />
        {/key}
      {:else}
        <div class="text-center">
          <h3 class="text-lg">No earnings available</h3>
        </div>
      {/if}
    {:else}
      <h3 class="text-xl">No creators found</h3>
    {/if}
  </div>
</div>
