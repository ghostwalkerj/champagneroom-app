<script lang="ts">
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import spacetime from 'spacetime';
  import { Doughnut } from 'svelte-chartjs';

  import type { CreatorDocumentType } from '$lib/models/creator';

  import { currencyFormatter } from '$lib/constants';

  export let creators: CreatorDocumentType[];

  const now = spacetime.now();
  let labels = [] as string[];
  let creatorData = [] as number[];

  if (creators) {
    for (const creator of creators) {
      creatorData = [...creatorData, creator.salesStats.totalRevenue];
      labels = [...labels, creator.user.name];
    }
  }

  const options = {
    responsive: true,
    circumference: 180,
    rotation: -90,
    animation: true,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      datalabels: {
        formatter: function (value: number | bigint) {
          return currencyFormatter().format(value);
        }
        //anchor: 'end'
      }
    }
  };

  $: data = {
    labels,
    datasets: [
      {
        data: creatorData,
        backgroundColor: ['#2D1B69', '#58C7F3', '#F3CC30', '#20134E'],
        borderWidth: 0
      }
    ]
  };
  Chart.register(ChartDataLabels);
</script>

<div class="bg-base-200 text-primary-content card w-auto">
  <div class="text-center card-body items-center">
    <div class="text-2xl card-title capitalize text-info">
      Top Creator - {now.monthName()}
    </div>
    {#if creators && creators.length > 0}
      {#if creatorData.length > 0}
        {#key creatorData}
          <Doughnut {data} {options} />
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
