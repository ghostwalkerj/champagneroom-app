<script lang="ts">
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import { onMount, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { SuperValidated } from 'sveltekit-superforms';
  import web3 from 'web3';

  import { invalidateAll, onNavigate } from '$app/navigation';
  import { page } from '$app/stores';

  import type { ticketFeedbackSchema } from '$lib/models/common';
  import { refundSchema, ticketDisputeSchema } from '$lib/models/common';
  import type { ShowDocument } from '$lib/models/show';
  import type { TicketDocument } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import {
    createTicketMachineService,
    type TicketMachineServiceType
  } from '$lib/machines/ticketMachine';

  import {
    DisputeReason,
    RefundReason,
    ShowStatus,
    TicketMachineEventString,
    TicketStatus
  } from '$lib/constants';
  import { ActorType } from '$lib/constants';
  import { InvoiceStatus, type PaymentType } from '$lib/payout';
  import { connect, defaultWallet, selectedAccount } from '$lib/web3';

  import { ShowStore, TicketStore } from '$stores';

  // eslint-disable-next-line @typescript-eslint/naming-convention
  import CancelTicket from './CancelTicket.svelte';
  import TicketDetail from './TicketDetail.svelte';
  import TicketInvoice from './TicketInvoice.svelte';
  import VideoMeeting from './VideoMeeting.svelte';

  import type { PageData } from './$types';

  export let data: PageData;

  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;
  let invoice = data.invoice;
  let user = data.user as UserDocument;
  let jitsiToken = data.jitsiToken as string;
  let feedbackForm = data.feedbackForm as SuperValidated<
    typeof ticketFeedbackSchema
  >;

  let disputeForm = data.disputeForm as SuperValidated<
    typeof ticketDisputeSchema
  >;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  $: shouldPay = false;
  let hasPaymentSent = false;
  $: canWatchShow = false;
  $: canCancelTicket = false;
  $: isShowInEscrow = false;
  $: isTicketDone = true;
  $: showVideo = false;
  let canLeaveFeedback = false;
  let canDispute = false;
  let isWaitingForShow = false;
  let showUnSub: Unsubscriber;
  let ticketUnSub: Unsubscriber;
  let isShowCancelLoading = false;
  $: hasShowStarted = false;
  $: isLoading = false;
  $: leftShow = false;
  let ticketMachineService: TicketMachineServiceType;
  const modalStore = getModalStore();

  const ticketFeedbackModal: ModalSettings = {
    type: 'component',
    component: 'TicketFeedback',
    meta: {
      feedbackForm
    }
  };

  const ticketDisputeModal: ModalSettings = {
    type: 'component',
    component: 'TicketDispute',
    meta: {
      disputeForm
    }
  };

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
        formData.append('paymentId', currentPayment.id!);
        formData.append('paymentCurrency', currentPayment.currency);

        await fetch($page.url.href + '?/initiate_payment', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.error(error);
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
    hasPaymentSent =
      state.matches('reserved.initiatedPayment') &&
      invoice.status !== InvoiceStatus.COMPLETE;
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
      dispute: ticketDisputeSchema.parse({
        disputedBy: ActorType.CUSTOMER,
        reason: DisputeReason.ENDED_EARLY
      }),
      refund: refundSchema.parse({
        reason: RefundReason.DISPUTE_DECISION
      })
    });
    isWaitingForShow =
      state.can(TicketMachineEventString.SHOW_JOINED) ||
      state.can(TicketMachineEventString.TICKET_REDEEMED);

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
    showVideo = true;
    isLoading = false;
  };

  const leaveFeedback = async () => {
    modalStore.trigger(ticketFeedbackModal);
  };

  const initiateDispute = async () => {
    modalStore.trigger(ticketDisputeModal);
  };

  const leftShowCallback = () => {
    showVideo = false;
    leftShow = true;

    let formData = new FormData();
    fetch('?/leave_show', {
      method: 'POST',
      body: formData
    });
  };

  onMount(() => {
    // Connect to the show and redirect if it started
    // @ts-ignore
    if (show) {
      hasShowStarted = show.showState.status === ShowStatus.LIVE;
      isShowInEscrow = show.showState.status === ShowStatus.IN_ESCROW;
    }

    if (ticket.ticketState.active) {
      showUnSub?.();
      showUnSub = ShowStore(show).subscribe((_show) => {
        if (_show) {
          show = _show;
          hasShowStarted = show.showState.status === ShowStatus.LIVE;
          isShowInEscrow = show.showState.status === ShowStatus.IN_ESCROW;
          if (canWatchShow && hasShowStarted && !leftShow) joinShow();
        }
      });

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
            if (
              invoice.status === InvoiceStatus.COMPLETE &&
              ticket.ticketState.status === TicketStatus.PAYMENT_INITIATED
            ) {
              ticket = $page.data.ticket as TicketDocument;
              ticketMachineService?.stop();
              ticketMachineService = createTicketMachineService({
                ticketDocument: ticket
              });
              useTicketMachine(ticketMachineService);
            }
          });
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

/** eslint-disable @typescript-eslint/naming-convention */
{#if showVideo}
  <VideoMeeting bind:show {user} {jitsiToken} {leftShowCallback} />
{:else if ticket}
  <div class="mt-6 flex flex-col lg:flex-row items-center justify-center">
    <div class="w-full lg:max-w-4xl mx-auto">
      <!-- Page header -->
      <div class="pb-4 text-center relative">
        {#key ticket.ticketState || show.showState}
          <TicketDetail {ticket} {show} {user} />
        {/key}
        {#if canWatchShow && hasShowStarted}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-4xl -rotate-6 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200/50 p-2 ring-inset rounded-xl"
          >
            <button
              class="btn variant-filled-secondary"
              disabled={isLoading}
              on:click={() => {
                joinShow();
              }}>Go to the Show</button
            >
          </div>
        {:else if isWaitingForShow}
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
              <button class="btn variant-filled-secondary" on:click={connect}
                >Connect Wallet</button
              >
            {:else}
              <button
                class="btn variant-filled-primary"
                on:click={walletPay}
                disabled={isLoading}>Pay with Wallet</button
              >
            {/if}
          {/if}
          {#if canWatchShow && hasShowStarted}
            <div class="w-full flex justify-center">
              <button
                class="btn variant-filled-secondary"
                disabled={isLoading}
                on:click={() => {
                  joinShow();
                }}>Go to the Show</button
              >
            </div>
          {/if}
          {#if canCancelTicket && !hasShowStarted}
            <CancelTicket bind:isLoading />
          {/if}
          <div class="flex flex-col md:flex-row">
            {#if canLeaveFeedback}
              <div class="p-4 w-full flex justify-center">
                <button
                  class="btn variant-filled-primary"
                  on:click={() => {
                    leaveFeedback();
                  }}>Leave Feedback</button
                >
              </div>
            {/if}
            {#if canLeaveFeedback && canDispute}
              <div class="w-full md:w-3/4 md:p-6 font-SpaceGrotesk h-1/2">
                <hr />
                OR
                <hr />
              </div>
            {/if}
            {#if canDispute}
              <div class="p-4 w-full flex justify-center">
                <button
                  class="btn variant-filled-primary"
                  on:click={() => {
                    initiateDispute();
                  }}>Initiate Dispute</button
                >
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
