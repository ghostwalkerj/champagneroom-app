<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import urlJoin from 'url-join';

  import { applyAction, enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_SHOWTIME_PATH } from '$env/static/public';

  import { CancelReason, DisputeReason } from '$lib/models/common';
  import { type ShowDocumentType, ShowStatus } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';

  import type { TicketMachineServiceType } from '$lib/machines/ticketMachine';
  import { createTicketMachineService } from '$lib/machines/ticketMachine';

  import { ActorType } from '$lib/constants';

  import { nameStore, showStore, ticketStore } from '$stores';

  import TicketDetail from './TicketDetail.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let ticket = data.ticket as TicketDocumentType;
  let show = data.show as ShowDocumentType;
  let invoice = data.invoice;

  const showTimePath = urlJoin($page.url.href, PUBLIC_SHOWTIME_PATH);
  const reasons = Object.values(DisputeReason);

  let shouldPay = false;
  $: canWatchShow = false;
  let canCancelTicket = false;
  let isTicketDone = false;
  let canLeaveFeedback = false;
  let canDispute = false;
  let hasMissedShow = false;
  let isWaitingForShow = false;
  let showUnSub: Unsubscriber;
  let ticketUnSub: Unsubscriber;
  let isShowPaymentLoading = false;
  let isShowCancelLoading = false;
  $: hasShowStarted = false;
  $: loading = false;

  nameStore.set(ticket.customerName);

  const useTicketMachine = (ticketMachineService: TicketMachineServiceType) => {
    const state = ticketMachineService.getSnapshot();
    shouldPay = state.matches('reserved.waiting4Payment');
    canWatchShow =
      state.matches('reserved.waiting4Show') || state.matches('redeemed');
    canCancelTicket = state.can({
      type: 'CANCELLATION INITIATED',
      cancel: {
        cancelledAt: new Date(),
        cancelledBy: ActorType.CUSTOMER,
        reason: CancelReason.CUSTOMER_CANCELLED
      }
    });
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
      }
    });
    hasMissedShow = state.matches('ended.missedShow');
    isWaitingForShow =
      state.matches('reserved.waiting4Show') && !hasShowStarted;
    isTicketDone = state.done ?? false;
  };

  onMount(() => {
    if (ticket.ticketState.activeState) {
      ticketUnSub = ticketStore(ticket).subscribe((ticketDocument) => {
        ticket = ticketDocument;
        useTicketMachine(
          createTicketMachineService({
            ticketDocument: ticket
          })
        );
      });
      showUnSub = showStore(show).subscribe((showDocument) => {
        show = showDocument;
        hasShowStarted = show.showState.status === ShowStatus.LIVE;
      });
    }
  });

  onDestroy(() => {
    showUnSub?.();
    ticketUnSub?.();
  });

  const onSubmit = (form: HTMLFormElement) => {
    if (form.name === 'buyTicket') {
      isShowPaymentLoading = true;
    } else if (form.name === 'cancelTicket') {
      isShowCancelLoading = true;
    }
    loading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        loading = false;
      }
      if (result.data.ticketCancelled) {
        invalidateAll();
        ticket = $page.data.ticket;
        show = $page.data.show;
        useTicketMachine(
          createTicketMachineService({
            ticketDocument: ticket
          })
        );
        showUnSub?.();
      }
      await applyAction(result);
      loading = false;
    };
  };
</script>

{#if ticket}
  <div class="mt-6 flex items-center">
    <div class="min-w-full">
      <!-- Page header -->
      <div class="pb-4 text-center relative">
        {#key ticket.ticketState || show.showState}
          <TicketDetail {ticket} {show} {invoice} />
        {/key}
        {#if isWaitingForShow}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl -rotate-12 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200/50 p-2 ring-inset rounded-xl"
          >
            Waiting for Show to Start
          </div>
        {/if}
      </div>

      {#if !isTicketDone}
        {#if shouldPay}
          <div>
            {#if isShowPaymentLoading}
              <div class="p-4">
                <div class="w-full flex justify-center">
                  <button class="btn btn-secondary loading" disabled={true}
                    >Sending Payment</button
                  >
                </div>
              </div>
            {:else}
              <!-- <form
                method="post"
                action="?/buy_ticket"
                name="buyTicket"
                use:enhance={({ form }) => onSubmit(form)}
              >
                <div class="w-full flex justify-center">
                  <button
                    class="btn btn-secondary"
                    type="submit"
                    disabled={loading}>Send Payment</button
                  >
                </div>
              </form> -->
              <div class="w-full flex justify-center">
                <button
                  class="btn btn-secondary"
                  on:click={() => {}}
                  disabled={loading}>Send Payment</button
                >
              </div>
            {/if}
          </div>
        {:else if canWatchShow && hasShowStarted}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button
                class="btn btn-secondary"
                disabled={loading}
                on:click={() => {
                  goto(showTimePath);
                }}>Go to the Show</button
              >
            </div>
          </div>
        {/if}
        {#if canCancelTicket}
          {#if isShowCancelLoading}
            <div class="p-4">
              <div class="w-full flex justify-center">
                <button class="btn btn-secondary loading" disabled={true}
                  >Cancelling</button
                >
              </div>
            </div>
          {:else}
            <div class="p-4">
              <form
                method="post"
                action="?/cancel_ticket"
                name="cancelTicket"
                use:enhance={({ form }) => onSubmit(form)}
              >
                <div class="w-full flex justify-center">
                  <button
                    class="btn btn-secondary"
                    type="submit"
                    disabled={loading}>Cancel Ticket</button
                  >
                </div>
              </form>
            </div>
          {/if}
        {/if}
        {#if canLeaveFeedback}
          <input type="checkbox" id="leave-feedback" class="modal-toggle" />
          <div class="modal">
            <div class="modal-box relative">
              <div class="text-lg text-center">Leave Feedback</div>
              <label
                for="leave-feedback"
                class="btn btn-sm btn-circle absolute right-2 top-2">✕</label
              >
              <div
                class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center w-full"
              >
                <form
                  method="post"
                  action="?/leave_feedback"
                  use:enhance={({ formElement }) => onSubmit(formElement)}
                >
                  <div class=" w-full py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="rating" class="label">
                      <span class="label-text">Rating</span></label
                    >
                    <div class="rating rating-lg">
                      <input
                        type="radio"
                        name="rating"
                        class="rating-hidden"
                        value="0"
                        checked
                      />
                      <input
                        type="radio"
                        name="rating"
                        value="1"
                        class="mask mask-star-2 bg-primary"
                      />
                      <input
                        type="radio"
                        name="rating"
                        value="2"
                        class="mask mask-star-2 bg-primary"
                      />
                      <input
                        type="radio"
                        name="rating"
                        value="3"
                        class="mask mask-star-2 bg-primary"
                      />
                      <input
                        type="radio"
                        name="rating"
                        value="4"
                        class="mask mask-star-2 bg-primary"
                      />
                      <input
                        type="radio"
                        name="rating"
                        value="5"
                        class="mask mask-star-2 bg-primary"
                      />
                    </div>
                    {#if form?.missingRating}<div
                        class="shadow-lg alert alert-error"
                      >
                        Rating is Required
                      </div>{/if}
                  </div>
                  <div class="max-w-s w-full py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="review" class="label">
                      <span class="label-text">Review</span></label
                    >
                    <div class="rounded-md shadow-sm mt-1 relative">
                      <textarea
                        name="review"
                        class="textarea textarea-lg textarea-primary"
                        value={form?.review ?? ''}
                      />
                    </div>
                  </div>

                  <div class="py-4 text-center">
                    {#if loading}
                      <button
                        class="btn btn-secondary loading"
                        type="submit"
                        disabled={true}>Submitting</button
                      >
                    {:else}
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={loading}>Submit</button
                      >
                    {/if}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="w-full flex justify-center">
              <label for="leave-feedback" class="btn btn-secondary"
                >Leave Feedback</label
              >
            </div>
          </div>
        {/if}
        {#if canLeaveFeedback && canDispute}
          <div class="w-full flex justify-center">
            <div class="divider w-36">OR</div>
          </div>
        {/if}
        {#if canDispute}
          <input type="checkbox" id="initiate-dispute" class="modal-toggle" />
          <div class="modal">
            <div class="modal-box relative">
              <div class="text-lg text-center">Initiate Dispute</div>

              <label
                for="initiate-dispute"
                class="btn btn-sm btn-circle absolute right-2 top-2">✕</label
              >
              <div
                class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
              >
                <form
                  method="post"
                  action="?/initiate_dispute"
                  use:enhance={({ form }) => onSubmit(form)}
                >
                  <div class="max-w-xs w-full py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="reason" class="label">
                      <span class="label-text">Reason</span></label
                    >
                  </div>
                  <select
                    class="select select-primary w-full max-w-xs"
                    name="reason"
                  >
                    <option disabled selected>Reason for the Dispute</option>

                    {#each reasons as reason}
                      <option>{reason}</option>
                    {/each}
                  </select>
                  {#if form?.missingReason}<div
                      class="shadow-lg alert alert-error"
                    >
                      Select a Reason
                    </div>{/if}
                  <div class="max-w-xs w-full py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="reaon" class="label">
                      <span class="label-text">Explanation</span></label
                    >
                    <div class="rounded-md shadow-sm mt-1 relative">
                      <textarea
                        name="explanation"
                        class="textarea textarea-primary textarea-lg"
                        value={form?.explanation ?? ''}
                      />
                      {#if form?.missingExplanation}<div
                          class="shadow-lg alert alert-error"
                        >
                          Provide an Explanation
                        </div>{/if}
                    </div>
                  </div>

                  <div class="py-4 text-center">
                    {#if loading}
                      <button
                        class="btn btn-secondary loading"
                        type="submit"
                        disabled={true}>Submitting</button
                      >
                    {:else}
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={loading}>Submit</button
                      >
                    {/if}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="w-full flex justify-center">
              <label for="initiate-dispute" class="btn btn-secondary"
                >Initiate Dispute</label
              >
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
