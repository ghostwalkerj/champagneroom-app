<script lang="ts">
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import { onMount, tick } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import web3 from 'web3';

  import { invalidateAll, onNavigate } from '$app/navigation';
  import { page } from '$app/stores';

  import type {
    ticketDisputeSchema,
    ticketFeedbackSchema
  } from '$lib/models/common';
  import type { ShowDocument } from '$lib/models/show';
  import type { TicketDocument } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import { TicketStatus } from '$lib/constants';
  import type { DisplayInvoice } from '$lib/ext/bitcart/models';
  import { InvoiceStatus, type PaymentType } from '$lib/payments';
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
  let invoice = data.invoice as DisplayInvoice | undefined;
  let user = data.user as UserDocument;
  let jitsiToken = data.jitsiToken as string;
  let feedbackForm = data.feedbackForm as SuperValidated<
    Infer<typeof ticketFeedbackSchema>
  >;
  let disputeForm = data.disputeForm as SuperValidated<
    Infer<typeof ticketDisputeSchema>
  >;
  $: tPermissions = data.ticketPermissions;

  const currentPayment = invoice?.payments?.[
    invoice?.payments?.length - 1
  ] as PaymentType;

  $: showVideo = false;
  let showUnSub: Unsubscriber;
  let ticketUnSub: Unsubscriber;
  let isShowCancelLoading = false;
  $: isLoading = false;
  $: leftShow = false;
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
    if (!tPermissions.isTicketDone) {
      showUnSub?.();
      showUnSub = ShowStore(show).subscribe((_show) => {
        if (_show) {
          show = _show;
          if (
            tPermissions.canWatchShow &&
            tPermissions.hasShowStarted &&
            !leftShow
          )
            joinShow();
        }
      });
      invalidateAll().then(() => {
        tPermissions = data.ticketPermissions;
      });

      ticketUnSub?.();
      ticketUnSub = TicketStore(ticket).subscribe((_ticket) => {
        if (_ticket) {
          ticket = _ticket;
          invalidateAll().then(() => {
            invoice = $page.data.invoice;
            if (
              invoice &&
              invoice.status === InvoiceStatus.COMPLETE &&
              ticket.ticketState.status === TicketStatus.PAYMENT_INITIATED
            ) {
              ticket = $page.data.ticket as TicketDocument;
            }
            tPermissions = data.ticketPermissions;
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

{#if showVideo}
  <VideoMeeting bind:show {user} {jitsiToken} {leftShowCallback} />
{:else if ticket}
  <div class="mt-6 flex flex-col items-center justify-center lg:flex-row">
    <div class="mx-auto w-full lg:max-w-4xl">
      <!-- Page header -->
      <div class="relative pb-4 text-center">
        {#key ticket.ticketState || show.showState}
          <TicketDetail {ticket} {show} {user} />
        {/key}
        {#if tPermissions.canWatchShow && tPermissions.hasShowStarted}
          <div
            class="bg-base-200/50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 transform whitespace-nowrap rounded-xl p-2 text-2xl font-extrabold text-primary-500 ring-2 ring-inset ring-primary-500 lg:text-4xl"
          >
            <button
              class="variant-filled-secondary btn"
              disabled={isLoading}
              on:click={() => {
                joinShow();
              }}>Go to the Show</button
            >
          </div>
        {:else if tPermissions.isWaitingForShow}
          <div
            class="bg-base-200/50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 transform whitespace-nowrap rounded-xl p-2 text-2xl font-extrabold text-primary-500 ring-2 ring-inset ring-primary-500 lg:text-4xl"
          >
            Waiting for Show to Start
          </div>
        {/if}
      </div>

      <!-- Invoice -->
      {#if !tPermissions.isTicketDone}
        <div class="relative">
          {#key invoice}
            <TicketInvoice {invoice} {ticket} />
          {/key}
          {#if tPermissions.hasPaymentSent}
            <div
              class="bg-base-200/50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 transform whitespace-nowrap rounded-xl p-2 text-2xl font-extrabold text-primary-500 ring-2 ring-inset ring-primary-500 lg:text-3xl"
            >
              Waiting for Payment Confirmations
            </div>
          {/if}
        </div>
      {/if}

      {#if !tPermissions.isTicketDone}
        <div class="m-3 flex flex-wrap justify-center gap-6">
          {#if tPermissions.shouldPay && !isShowCancelLoading}
            {#if !$selectedAccount}
              <button class="variant-filled-secondary btn" on:click={connect}
                >Connect Wallet</button
              >
            {:else}
              <button
                class="variant-filled-primary btn"
                on:click={walletPay}
                disabled={isLoading}>Pay with Wallet</button
              >
            {/if}
          {/if}
          {#if tPermissions.canWatchShow && tPermissions.hasShowStarted}
            <div class="flex w-full justify-center">
              <button
                class="variant-filled-secondary btn"
                disabled={isLoading}
                on:click={() => {
                  joinShow();
                }}>Go to the Show</button
              >
            </div>
          {/if}
          {#if tPermissions.canCancelTicket && !tPermissions.hasShowStarted}
            <CancelTicket bind:isLoading />
          {/if}
          <div class="flex flex-col md:flex-row">
            {#if tPermissions.canLeaveFeedback}
              <div class="flex w-full justify-center p-4">
                <button
                  class="variant-filled-primary btn"
                  on:click={() => {
                    leaveFeedback();
                  }}>Leave Feedback</button
                >
              </div>
            {/if}
            {#if tPermissions.canLeaveFeedback && tPermissions.canDispute}
              <div class="h-1/2 w-full font-SpaceGrotesk md:w-3/4 md:p-6">
                <hr />
                OR
                <hr />
              </div>
            {/if}
            {#if tPermissions.canDispute}
              <div class="flex w-full justify-center p-4">
                <button
                  class="variant-filled-primary btn"
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
