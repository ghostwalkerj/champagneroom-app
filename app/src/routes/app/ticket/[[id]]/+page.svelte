<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import urlJoin from 'url-join';
  import web3 from 'web3';

  import { goto, invalidateAll, onNavigate } from '$app/navigation';
  import { page } from '$app/stores';

  import type { RefundType } from '$lib/models/common';
  import { DisputeReason, RefundReason } from '$lib/models/common';
  import { type ShowDocumentType, ShowStatus } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import type { TicketMachineServiceType } from '$lib/machines/ticketMachine';
  import { createTicketMachineService } from '$lib/machines/ticketMachine';

  import Config from '$lib/config';
  import { ActorType } from '$lib/constants';
  import type { PaymentType } from '$lib/payment';
  import { connect, defaultWallet, selectedAccount } from '$lib/web3';

  import { ShowStore, TicketStore } from '$stores';

  import CancelTicket from './CancelTicket.svelte';
  import DisputeTicket from './DisputeTicket.svelte';
  import LeaveFeedback from './LeaveFeedback.svelte';
  import TicketDetail from './TicketDetail.svelte';
  import TicketInvoice from './TicketInvoice.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let ticket = data.ticket as TicketDocumentType;
  let show = data.show as ShowDocumentType;
  let invoice = data.invoice;

  let user = ticket.user as unknown as UserDocument;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  const showTimePath = urlJoin(Config.Path.ticket, Config.Path.showTime);

  $: shouldPay = false;
  let hasPaymentSent = false;
  $: canWatchShow = false;
  $: canCancelTicket = false;
  $: isShowInEscrow = false;
  $: isTicketDone = true;
  let canLeaveFeedback = false;
  let canDispute = false;
  let hasMissedShow = false;
  let isWaitingForShow = false;
  let showUnSub: Unsubscriber;
  let ticketUnSub: Unsubscriber;
  let isShowCancelLoading = false;
  $: hasShowStarted = false;
  $: isLoading = false;
  let ticketMachineService: TicketMachineServiceType;

  const walletPay = async () => {
    isLoading = true;

    if ($selectedAccount) {
      // Make sure to use correct chain id
      const chain = $defaultWallet?.chains.find(
        (chain) => +chain.id === currentPayment.chain_id
      );
      if (!chain) {
        throw new Error('Chain not found');
      }

      if (!$defaultWallet?.provider) {
        throw new Error('Provider not found');
      }

      const eth = new web3($defaultWallet.provider);
      const provider = eth.currentProvider;
      if (!provider) {
        throw new Error('Provider not found');
      }

      const parameters = [
        {
          from: $selectedAccount.address,
          to: currentPayment.payment_address,
          value: Number.parseInt(
            web3.utils.toWei(currentPayment.amount.toString(), 'ether')
          ).toString(16),
          chainId: currentPayment.chain_id
        }
      ];

      try {
        await provider.request({
          method: 'eth_sendTransaction',
          params: parameters
        });

        // Initiate payment by adding address to the invoice
        let formData = new FormData();
        formData.append('address', $selectedAccount.address);
        formData.append('bcInvoiceId', invoice.id!);
        formData.append('paymentId', currentPayment.id!);
        formData.append('ticketId', ticket._id.toString());

        await fetch($page.url.href + '?/initiate_payment', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      await connect();
    }
    isLoading = false;
  };

  const useTicketMachine = async (
    ticketMachineService: TicketMachineServiceType
  ) => {
    const state = ticketMachineService.getSnapshot();
    shouldPay = state.matches('reserved.waiting4Payment');
    canWatchShow =
      state.matches('reserved.waiting4Show') || state.matches('redeemed');
    hasPaymentSent = state.matches('reserved.initiatedPayment');
    canCancelTicket =
      (state.matches('reserved.waiting4Show') ||
        state.matches('reserved.waiting4Payment')) &&
      !hasShowStarted;
    canLeaveFeedback = state.can({
      type: 'FEEDBACK RECEIVED',
      feedback: {
        createdAt: new Date(),
        rating: 5
      }
    });

    canDispute = state.can({
      type: 'DISPUTE INITIATED',
      dispute: {
        startedAt: new Date(),
        disputedBy: ActorType.CUSTOMER,
        reason: DisputeReason.ENDED_EARLY,
        explanation: 'The show ended early',
        resolved: false
      },
      refund: {
        requestedAmounts: {} as Map<string, number>,
        approvedAmounts: {} as Map<string, number>,
        requestedAt: new Date(),
        transactions: [],
        actualAmounts: {} as Map<string, number>,
        reason: RefundReason.DISPUTE_DECISION,
        totals: {} as Map<string, number>,
        payouts: {} as any
      } as RefundType
    });
    hasMissedShow = state.matches('ended.missedShow');
    isWaitingForShow =
      state.matches('reserved.waiting4Show') && !hasShowStarted;
    isTicketDone = state.done ?? false;
    if (state.done) {
      showUnSub?.();
      ticketUnSub?.();
    }
  };

  const joinShow = async () => {
    isLoading = true;
    let formData = new FormData();
    fetch('?/join_show', {
      method: 'POST',
      body: formData
    });
    await goto(showTimePath);
  };

  onMount(() => {
    if (show) {
      hasShowStarted = show.showState.status === ShowStatus.LIVE;
      isShowInEscrow = show.showState.status === ShowStatus.IN_ESCROW;
    }
    if (ticket.ticketState.active) {
      isTicketDone = false;
      ticketMachineService?.stop();
      ticketMachineService = createTicketMachineService({
        ticketDocument: ticket
      });
      useTicketMachine(ticketMachineService);
      ticketUnSub?.();
      ticketUnSub = TicketStore(ticket).subscribe((_ticket) => {
        if (_ticket) {
          ticket = _ticket;
          ticketMachineService?.stop();
          ticketMachineService = createTicketMachineService({
            ticketDocument: ticket
          });
          useTicketMachine(ticketMachineService);

          invalidateAll().then(() => {
            invoice = $page.data.invoice;
          });
        }
      });

      showUnSub?.();
      showUnSub = ShowStore(show).subscribe((_show) => {
        if (_show) {
          show = _show;
          hasShowStarted = show.showState.status === ShowStatus.LIVE;
          isShowInEscrow = show.showState.status === ShowStatus.IN_ESCROW;
        }
      });
    }
  });

  onNavigate(async () => {
    await tick();
    showUnSub?.();
    ticketUnSub?.();
  });
</script>

{#if ticket}
  <div class="mt-6 flex flex-col lg:flex-row items-center justify-center">
    <div class="w-full lg:max-w-4xl mx-auto">
      <!-- Page header -->
      <div class="pb-4 text-center relative">
        {#key ticket.ticketState || show.showState}
          <TicketDetail {ticket} {show} {user} />
        {/key}
        {#if isWaitingForShow}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-4xl -rotate-6 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200/50 p-2 ring-inset rounded-xl"
          >
            Waiting for Show to Start
          </div>
        {/if}
      </div>

      <!-- Invoice -->
      {#if !isTicketDone && !isShowInEscrow}
        <div class="relative">
          {#key invoice}
            <TicketInvoice {invoice} {ticket} />
          {/key}
          {#if hasPaymentSent}
            <div
              class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl -rotate-45 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200/50 p-2 ring-inset rounded-xl"
            >
              Waiting for Payment Confirmations
            </div>
          {/if}
        </div>
      {/if}

      {#if !isTicketDone}
        <div class="flex flex-wrap gap-6 justify-center m-3">
          {#if shouldPay && !isShowCancelLoading}
            {#if !$selectedAccount}
              <button class="btn btn-secondary" on:click={connect}
                >Connect Wallet</button
              >
            {:else}
              <button
                class="btn btn-secondary"
                on:click={walletPay}
                disabled={isLoading}>Pay with Wallet</button
              >
            {/if}
          {/if}
          {#if canWatchShow && hasShowStarted}
            <div class="w-full flex justify-center">
              <button
                class="btn btn-secondary"
                disabled={isLoading}
                on:click={() => {
                  isLoading = true;
                  joinShow();
                }}>Go to the Show</button
              >
            </div>
          {/if}
          {#if canCancelTicket && !hasShowStarted}
            <CancelTicket bind:isLoading />
          {/if}
          {#if canLeaveFeedback}
            <LeaveFeedback bind:isLoading {form} />
          {/if}
          {#if canLeaveFeedback && canDispute}
            <div class="divider w-36 pt-6">OR</div>
          {/if}
          {#if canDispute}
            <DisputeTicket bind:isLoading {form} />
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
