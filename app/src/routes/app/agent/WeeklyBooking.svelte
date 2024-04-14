<script lang="ts">
  import Icon from '@iconify/svelte';
  import Chart from 'chart.js/auto';
  import autocolors from 'chartjs-plugin-autocolors';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import { Line } from 'svelte-chartjs';

  import type { CreatorDocument } from '$lib/models/creator';

  export let creators: CreatorDocument[];
  export let weeklyData: {
    creatorId: string;
    dayOfWeek: number;
    bookings: number;
  }[];
  let datasets = [] as { label: string; data: number[] }[];

  if (creators) {
    for (const data of weeklyData) {
      const name = creators.find(
        (creator) => creator._id.toString() === data.creatorId
      )?.user.name;
      if (name) {
        let dataRow = datasets.findIndex((dataset) => dataset.label === name);

        if (dataRow === -1) {
          dataRow = datasets.push({
            label: name,
            data: [0, 0, 0, 0, 0, 0, 0]
          });
        }
        datasets[dataRow - 1].data[data.dayOfWeek] = data.bookings;
      }
    }
  }

  const options = {
    plugins: {
      autocolors: {
        mode: 'label'
      }
    },
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
    backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30', '#20134E'],

    labels: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],
    datasets
  };
  Chart.register(ChartDataLabels);
  Chart.register(autocolors);
</script>

<div
  class="bg-custom flex flex-col items-center justify-center gap-4 rounded p-4"
>
  <div class="flex flex-col items-center gap-0 text-center">
    <h2 class="flex items-center gap-2 text-xl font-semibold">
      <Icon class="text-secondary-500" icon="mdi:dance-pole" />
      Weekly Bookings
    </h2>
    {#if creators && creators.length > 0}
      {#if datasets.length > 0}
        {#key datasets}
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
