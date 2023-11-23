<script lang="ts">
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import { Line } from 'svelte-chartjs';
  import autocolors from 'chartjs-plugin-autocolors';

  import type { CreatorDocumentType } from '$lib/models/creator';

  export let creators: CreatorDocumentType[];
  export let weeklyData: {
    creatorId: string;
    dayOfWeek: number;
    bookings: number;
  }[];
  let datasets = [] as { label: string; data: number[] }[];

  if (creators) {
    weeklyData.forEach((data) => {
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
    });
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

<div class="bg-primary text-primary-content card">
  <div class="text-center card-body items-center">
    <div class="text-2xl card-title capitalize">Weekly Bookings</div>
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
