<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createTicketMachineService } from '$lib/machines/ticketMachine';
  import type { ShowDocType } from '$lib/models/show';
  import {
    TicketDisputeReason,
    type TicketDocType,
    TicketStatus,
  } from '$lib/models/ticket';
  import urlJoin from 'url-join';

  import type { ActionData, PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  export let form: ActionData;

  let ticket = data.ticket as TicketDocType;
  let show = data.show as ShowDocType;

  const showPath = urlJoin($page.url.href, 'show');
  const reasons = Object.values(TicketDisputeReason);
  let ticketMachineService = createTicketMachineService({
    ticketDocument: ticket,
  });

  let needs2Pay = false;
  let canWatchShow = false;
  let canCancelTicket = false;
  let ticketDone = false;
  let canLeaveFeedback = false;
  let canDispute = false;
  let waitingForShow = false;

  $: ticketMachineService.subscribe(state => {
    needs2Pay = state.matches('reserved.waiting4Payment');
    canWatchShow = state.can('JOINED SHOW');
    canCancelTicket = state.can({
      type: 'REQUEST CANCELLATION',
      cancel: undefined,
    });
    canLeaveFeedback = state.can({
      type: 'FEEDBACK RECEIVED',
      feedback: undefined,
    });
    canDispute = state.can({
      type: 'DISPUTE INITIATED',
      dispute: undefined,
    });

    waitingForShow = state.matches('reserved.waiting4Show') && !canWatchShow;

    ticketDone = state.done ?? false;
  });

  $: waiting4StateChange = false;

  const onSubmit = () => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        waiting4StateChange = false;
      }
      if (result.data.ticketCancelled) {
        ticketDone = true;
        ticket.ticketState.status = TicketStatus.CANCELLED;
      }
      await applyAction(result);
    };
  };
</script>

{#if ticket}
  <div class="mt-6 flex items-center">
    <div class="min-w-full">
      <!-- Page header -->
      <div class="pb-4 text-center relative">
        <TicketDetail ticket="{ticket}" show="{show}" />
        {#if waitingForShow}
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl -rotate-12 whitespace-nowrap font-extrabold text-primary ring-2 ring-primary bg-base-200/50 p-2 ring-inset rounded-xl"
          >
            Waiting for Show to Start
          </div>
        {/if}
      </div>

      {#if !ticketDone}
        {#if needs2Pay}
          <div>
            {#if waiting4StateChange}
              <div class="p-4">
                <div class="w-full flex justify-center">
                  <button class="btn loading" disabled="{true}"
                    >Sending Payment</button
                  >
                </div>
              </div>
            {:else}
              <form
                method="post"
                action="?/buy_ticket"
                use:enhance="{onSubmit}"
              >
                <div class="w-full flex justify-center">
                  <button
                    class="btn"
                    type="submit"
                    disabled="{waiting4StateChange}">Send Payment</button
                  >
                </div>
              </form>
            {/if}
          </div>
        {:else if canWatchShow}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button
                class="btn"
                disabled="{waiting4StateChange}"
                on:click="{() => {
                  goto(showPath);
                }}">Go to the Show</button
              >
            </div>
          </div>
        {/if}
        {#if canCancelTicket}
          <div class="p-4">
            <form
              method="post"
              action="?/cancel_ticket"
              use:enhance="{onSubmit}"
            >
              <div class="w-full flex justify-center">
                <button
                  class="btn"
                  type="submit"
                  disabled="{waiting4StateChange}">Cancel Ticket</button
                >
              </div>
            </form>
          </div>
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
                class="grid grid-rows-1 gap-4 grid-flow-col justify-center items-center"
              >
                <form
                  method="post"
                  action="?/leave_feedback"
                  use:enhance="{onSubmit}"
                >
                  <div class="max-w-xs w-full py-2 form-control">
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
                  <div class="max-w-xs w-full py-2 form-control">
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label for="review" class="label">
                      <span class="label-text">Review</span></label
                    >
                    <div class="rounded-md shadow-sm mt-1 relative">
                      <textarea
                        name="review"
                        class="textarea textarea-primary"
                        value="{form?.review ?? ''}"></textarea>
                    </div>
                  </div>

                  <div class="py-4 text-center">
                    {#if waiting4StateChange}
                      <button
                        class="btn btn-secondary loading"
                        type="submit"
                        disabled="{true}">Submitting</button
                      >
                    {:else}
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled="{waiting4StateChange}">Submit</button
                      >
                    {/if}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="w-full flex justify-center">
              <label for="leave-feedback" class="btn">Leave Feedback</label>
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
                  use:enhance="{onSubmit}"
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
                        class="textarea textarea-primary"
                        value="{form?.explanation ?? ''}"></textarea>
                      {#if form?.missingExplanation}<div
                          class="shadow-lg alert alert-error"
                        >
                          Provide an Explanation
                        </div>{/if}
                    </div>
                  </div>

                  <div class="py-4 text-center">
                    {#if waiting4StateChange}
                      <button
                        class="btn btn-secondary loading"
                        type="submit"
                        disabled="{true}">Submitting</button
                      >
                    {:else}
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled="{waiting4StateChange}">Submit</button
                      >
                    {/if}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="w-full flex justify-center">
              <label for="initiate-dispute" class="btn">Initiate Dispute</label>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
