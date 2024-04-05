<script lang="ts">
  import Icon from '@iconify/svelte';
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import spacetime from 'spacetime';
  import { Doughnut } from 'svelte-chartjs';

  import type { CreatorDocument } from '$lib/models/creator';

  import type { CurrencyType } from '$lib/constants';
  import { currencyFormatter } from '$lib/constants';

  export let creators: CreatorDocument[];
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

<div
  class="bg-custom flex flex-col items-center justify-center gap-4 rounded p-4"
>
  <div class="flex flex-col items-center gap-0 text-center">
    <h2 class="flex items-center gap-2 text-xl font-semibold">
      <Icon class="text-secondary" icon="circum:trophy" />
      Top Creators - {now.format('month')}
    </h2>

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
