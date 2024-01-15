<script lang="ts">
  import { currencyFormatter } from '$lib/constants';
  import type { EarningsType } from '$lib/models/common';
  import type { PayoutType } from '$lib/models/common';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
  import type { TableSource } from '@skeletonlabs/skeleton';
  import { TabGroup, Tab } from '@skeletonlabs/skeleton';
  import { PayoutStatus } from '$lib/payment';

  let parent: SvelteComponent;
  const modalStore = getModalStore();

  let earnings: EarningsType[] = $modalStore[0].meta.earnings;
  let payouts: PayoutType[] = $modalStore[0].meta.payouts;

  earnings = earnings.map((earning) => {
    return {
      ...earning,
      finalAmount: currencyFormatter(earning.currency).format(earning.amount),
      finalEarnedAt: new Date(earning.earnedAt).toLocaleDateString()
    };
  });
  const tableEarnings: TableSource = {
    // A list of heading labels.
    head: ['Date', 'Transaction'],
    // The data visibly shown in your table body UI.
    body: tableMapperValues(earnings, ['finalEarnedAt', 'finalAmount'])
  };

  function getStatusClass(status: string) {
    switch (status) {
      case PayoutStatus.PENDING.toLowerCase():
        return 'variant-soft-warning';
      case PayoutStatus.APPROVED.toLowerCase():
        return 'variant-soft-success';
      case PayoutStatus.CANCELLED.toLowerCase():
        return 'variant-soft-error';
      case PayoutStatus.FAILED.toLowerCase():
        return 'variant-soft-error';
      case PayoutStatus.SENT.toLowerCase():
        return 'variant-soft-warning';
      case PayoutStatus.COMPLETE.toLowerCase():
        return 'variant-soft-success';
      default:
        return 'variant-soft-surface';
    }
  }

payouts = payouts.map((payout) => {
        return {
            ...payout,
            finalAmount: currencyFormatter(payout.payoutCurrency).format(payout.amount),
            finalEarnedAt: new Date(payout.payoutAt).toLocaleDateString(),
            finalStatus: `<span class="badge
            ${
                getStatusClass(payout.payoutStatus!.toLowerCase())}
            ">${payout.payoutStatus}</span>`
    };
  });
  const tablePayouts: TableSource = {
    // A list of heading labels.
    head: ['Date', 'Transaction', 'Status'],
    // The data visibly shown in your table body UI.
    body: tableMapperValues(payouts, [
      'finalEarnedAt',
      'finalAmount',
      'finalStatus'
    ])
  };

  let tabSet: number = 0;
</script>

<div
  class="bg-surface-900 w-modal p-4 rounded flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
>
  <h2 class="font-semibold text-xl text-center">Recent Transactions</h2>

  <TabGroup justify="justify-center" active="!border-b-2 !border-primary">
    <Tab bind:group={tabSet} name="Earnings" value={0}>
      <span>Earnings</span>
    </Tab>
    <Tab bind:group={tabSet} name="Payouts" value={1}>Payouts</Tab>
    <!-- Tab Panels --->
    <svelte:fragment slot="panel">
      {#if tabSet === 0}
        <Table source={tableEarnings} interactive />
      {:else if tabSet === 1}
        <Table source={tablePayouts} interactive />
      {/if}
    </svelte:fragment>
  </TabGroup>
</div>
