<script lang="ts">
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import { Doughnut } from 'svelte-chartjs';

  import type { CreatorDocumentType } from '$lib/models/creator';

  import { currencyFormatter } from '$lib/constants';
  import type { CurrencyType } from '$lib/models/common';
  import spacetime from 'spacetime';

  export let creators: CreatorDocumentType[];
  export let showData: {
    creatorId: string;
    amount: number;
    currency: CurrencyType;
  }[];

  let creatorData: number[] = [];
  let labels = [] as string[];
  const now = spacetime.now();

  if (creators) {
    for (const data of showData) {
      const creator = creators.find(
        (creator) => creator._id.toString() === data.creatorId
      );
      if (!creator) continue;
      creatorData.push(data.amount);
      labels.push(creator.user.name);
    }
  }

  const options = {
    responsive: true,
    circumference: 180,
    rotation: -90,
    animation: true,
    plugins: {
      autocolors: {
        mode: 'label'
      },
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

<div class="bg-primary text-primary-content daisy-card">
  <div class="text-center daisy-card-body items-center">
    <div class="text-2xl daisy-card-title capitalize">
      Top Creators - {now.monthName()}
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
