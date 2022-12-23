<script lang="ts">
  import { browser } from '$app/environment';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
  import VideoCall from '$lib/components/calls/VideoCall.svelte';
  import VideoPreview from '$lib/components/calls/VideoPreview.svelte';
  import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
  import { callMachine } from '$lib/machines/callMachine';
  import {
    createLinkMachineService,
    type LinkMachineServiceType,
  } from '$lib/machines/linkMachine';
  import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
  import type { LinkDocType, LinkDocument } from '$lib/ORM/models/link';
  import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import { currencyFormatter } from '$lib/util/constants';
  import { userStream, type UserStreamType } from '$lib/util/userStream';
  import type { VideoCallType } from '$lib/util/videoCall';
  import { onDestroy, onMount } from 'svelte';
  import { PhoneIncomingIcon } from 'svelte-feather-icons';
  import StarRating from 'svelte-star-rating';
  import type { EventObject, Subscription } from 'xstate';
  import type { PageData } from './$types';
  import LinkViewer from './LinkView.svelte';
  import TalentActivity from './TalentActivity.svelte';
  import TalentWallet from './TalentWallet.svelte';

  export let form: import('./$types').ActionData;

  export let data: PageData;
  const token = data.token;

  let talentObj = data.talent as TalentDocType;
  let completedCalls = data.completedCalls as LinkDocType[];
  $: currentLink = data.currentLink as LinkDocument;
  let key = $page.params.key;
  let vc: VideoCallType;
  let talent: TalentDocument;
  let linkMachineService: LinkMachineServiceType;
  let linkSub: Subscription;

  $: ready4Call = false;
  $: showCallModal = false;
  $: inCall = false;
  let us: Awaited<UserStreamType>;
  let callMachineState = callMachine.initialState;
  let callEvent: EventObject;
  let mediaStream: MediaStream;
  $: callerName = '';
  let videoCall: any;
  let linkMachineState =
    currentLink &&
    createLinkMachineService(currentLink.linkState).getSnapshot();

  $: canCancelLink =
    linkMachineState &&
    linkMachineState.can({
      type: 'REQUEST CANCELLATION',
      cancel: undefined,
    });

  $: canCreateLink =
    !currentLink ||
    (linkMachineState && linkMachineState.done) ||
    (linkMachineState && linkMachineState.matches('inEscrow'));

  $: waiting4StateChange = false;

  let connectedCallId: string;

  const useLinkState = (
    link: LinkDocument,
    linkState: LinkDocument['linkState']
  ) => {
    if (linkMachineService) linkMachineService.stop();
    if (linkSub) linkSub.unsubscribe();

    linkMachineService = createLinkMachineService(
      linkState,
      link.updateLinkStateCallBack()
    );
    linkSub = linkMachineService.subscribe(state => {
      linkMachineState = state;

      if (state.changed) {
        canCancelLink = state.can({
          type: 'REQUEST CANCELLATION',
          cancel: undefined,
        });
        canCreateLink = state.done ?? true;

        if (state.matches('claimed.canCall')) {
          if (connectedCallId !== currentLink.callId) {
            connectedCallId = currentLink.callId;
            initVC(currentLink.callId);
          }
        } else if (vc && !callMachineState.done) {
          connectedCallId = '';
          vc.destroy();
        }
      }
    });
  };

  const useLink = (link: LinkDocument) => {
    currentLink = link;
    waiting4StateChange = false; // link changed, so can submit again
    useLinkState(link, link.linkState);
    link.get$('linkState').subscribe(_linkState => {
      waiting4StateChange = false; // link changed, so can submit again
      useLinkState(link, _linkState);
    });
  };

  const updateProfileImage = async (url: string) => {
    if (url && talent) {
      talent.update({
        $set: {
          profileImageUrl: url,
          updatedAt: new Date().getTime(),
        },
      });
      if (currentLink) {
        currentLink.update({
          $set: {
            talentInfo: {
              ...currentLink.talentInfo,
              profileImageUrl: url,
            },
            updatedAt: new Date().getTime(),
          },
        });
      }
    }
  };

  const answerCall = () => {
    showCallModal = false;
    vc.acceptCall(mediaStream);
  };

  const initVC = (callId: string) => {
    if (!browser) return;

    global = window;
    import('$lib/util/videoCall').then(_vc => {
      videoCall = _vc.videoCall;
      vc = videoCall(callId);
      // vc.callEvent.subscribe(ce => {
      //   // Log call events on the Talent side
      //   if (ce) {
      //     callEvent = ce;
      //     let eventType: CallEventType | undefined;
      //     switch (ce.type) {
      //       case 'CALL INCOMING':
      //         eventType = CallEventType.ATTEMPT;
      //         break;

      //       case 'CALL ACCEPTED':
      //         eventType = CallEventType.ANSWER;
      //         break;

      //       case 'CALL CONNECTED':
      //         eventType = CallEventType.CONNECT;
      //         linkMachineService.send('CALL CONNECTED');
      //         break;

      //       case 'CALL UNANSWERED':
      //         eventType = CallEventType.NO_ANSWER;
      //         break;

      //       case 'CALL REJECTED':
      //         eventType = CallEventType.REJECT;
      //         break;

      //       case 'CALL DISCONNECTED':
      //         eventType = CallEventType.DISCONNECT;
      //         linkMachineService.send('CALL DISCONNECTED');
      //         break;

      //       case 'CALL HANGUP':
      //         eventType = CallEventType.HANGUP;
      //         break;
      //     }
      //     if (eventType !== undefined) {
      //       currentLink.createCallEvent(eventType).then(callEvent => {
      //         linkMachineService.send({
      //           type: 'CALL EVENT RECEIVED',
      //           callEvent,
      //         });
      //       });
      //     }
      //   }
      // });

      vc.callMachineState.subscribe(cs => {
        // Logic for all of the possible call states
        if (cs) {
          callMachineState = cs;
          if (cs.changed) {
            showCallModal = callMachineState.matches('receivingCall');
            inCall = callMachineState.matches('inCall');
            ready4Call = callMachineState.matches('ready4Call');
          }
        }
      });
      vc.callerName.subscribe(name => {
        if (name) callerName = name;
      });
    });
  };

  onMount(async () => {
    us = await userStream();
    us.mediaStream.subscribe(stream => {
      if (stream) mediaStream = stream;
    });
  });

  onDestroy(async () => {
    if (vc) vc.destroy();
  });

  const onSubmit = ({ form }) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      } else {
        if (form) form.reset();
      }
      await applyAction(result);
    };
  };

  if (browser) {
    talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
      db.talents
        .findOne(talentObj._id)
        .exec()
        .then(_talent => {
          if (_talent) {
            talentObj = _talent;
            talent = _talent;
            talent.get$('currentLink').subscribe(linkId => {
              // if (linkId) {
              //   db.links
              //     .findOne(linkId)
              //     .exec()
              //     .then(link => {
              //       if (link) useLink(link);
              //     });
              // }
            });
          }
        });
    });
  }
</script>

<input
  type="checkbox"
  id="incomingcall-modal"
  class="modal-toggle"
  bind:checked={showCallModal}
/>
<div class="modal">
  <div class="modal-box">
    <div class="flex flex-row pt-4 gap-2 place-items-center justify-between">
      <div class="font-bold text-lg  ">Incoming pCall</div>
      <div
        class="h-14 animate-shock animate-loop w-14 animated  btn btn-circle "
      >
        <PhoneIncomingIcon size="34" />
      </div>
    </div>
    <p class="py-4">
      You have an incoming pCall from <span class="font-bold">{callerName}</span
      >
    </p>
    <div class="modal-action">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <label for="call-modal" class="btn" on:click={answerCall}>Answer</label>
    </div>
  </div>
</div>

<div class="min-h-full">
  <main class="py-10">
    <!-- Page header -->
    <div
      class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
    >
      <div class="flex space-x-5 items-center">
        <div>
          <h1 class="font-bold text-5xl">Request a pCall</h1>
          <p class="pt-6">
            Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam.
            Posuit eam ad opus nunc et adepto a pCall!
          </p>
        </div>
      </div>
    </div>
    {#if !inCall}
      <div
        class="mx-auto mt-8 max-w-3xl grid gap-6 grid-cols-1 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
      >
        <div class="space-y-6 lg:col-start-1 lg:col-span-2">
          <div>
            <LinkViewer link={currentLink} {linkMachineState} />
          </div>
          {#if canCancelLink}
            <!-- Link Form-->
            <form method="post" action="?/cancel_link" use:enhance={onSubmit}>
              <div class="bg-primary text-primary-content card">
                <div class="text-center card-body items-center">
                  <div class="text-2xl card-title">Cancel Your pCall Link</div>
                  <div class="text xl">
                    If you cancel this pCall link, the link will be deactivated
                    and nobody can use it to call.
                  </div>
                  {#if linkMachineState.context.linkState.totalFunding > 0}
                    {currencyFormatter.format(
                      linkMachineState.context.linkState.totalFunding
                    )} will be refunded to "{linkMachineState.context.linkState
                      .claim?.caller}"
                  {/if}

                  <div
                    class="flex flex-col text-white p-2 justify-center items-center"
                  >
                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Cancel Link</button
                      >
                    </div>
                  </div>
                </div>
              </div>
            </form>
          {:else if canCreateLink}
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">Create a New pCall Link</h2>
                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <form
                    method="post"
                    action="?/create_link"
                    use:enhance={onSubmit}
                  >
                    <div class="max-w-xs w-full py-2 form-control ">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label for="price" class="label">
                        <span class="label-text">Requested Amount in USD</span
                        ></label
                      >
                      <div class="rounded-md shadow-sm mt-1 relative">
                        <div
                          class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                        >
                          <span class="text-gray-500 sm:text-sm"> $ </span>
                        </div>
                        <input
                          type="text"
                          name="amount"
                          class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                          placeholder="0.00"
                          aria-describedby="price-currency"
                          value={form?.amount ?? ''}
                        />
                        <div
                          class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
                        >
                          <span
                            class="text-gray-500 sm:text-sm"
                            id="price-currency"
                          >
                            USDC
                          </span>
                        </div>
                      </div>
                      {#if form?.missingAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Amount is required
                        </div>{/if}
                      {#if form?.invalidAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Invalid Amount
                        </div>{/if}
                    </div>

                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Generate Link</button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>
          {:else if linkMachineState && linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')}
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">
                  Issue Refund for Cancelled Link
                </h2>
                <div
                  class="flex flex-col text-white p-2 justify-center items-center"
                >
                  <form
                    method="post"
                    action="?/send_refund"
                    use:enhance={onSubmit}
                  >
                    <div class="max-w-xs w-full py-2 form-control ">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label for="price" class="label">
                        <span class="label-text"
                          >Refund {linkMachineState.context.linkState.claim &&
                            linkMachineState.context.linkState.claim
                              .caller}</span
                        ></label
                      >
                      <div class="rounded-md shadow-sm mt-1 relative">
                        <div
                          class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
                        >
                          <span class="text-gray-500 sm:text-sm"> $ </span>
                        </div>
                        <input
                          type="text"
                          name="amount"
                          class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
                          placeholder="0.00"
                          aria-describedby="price-currency"
                          value={form?.amount ?? ''}
                        />
                        <div
                          class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
                        >
                          <span
                            class="text-gray-500 sm:text-sm"
                            id="price-currency"
                          >
                            USDC
                          </span>
                        </div>
                      </div>
                      {#if form?.missingAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Amount is required
                        </div>{/if}
                      {#if form?.invalidAmount}<div
                          class="shadow-lg alert alert-error"
                        >
                          Invalid Amount
                        </div>{/if}
                    </div>

                    <div class="py-4">
                      <button
                        class="btn btn-secondary"
                        type="submit"
                        disabled={waiting4StateChange}>Send Refund</button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>
          {/if}

          <!-- Camera  Preview -->
          <div class="bg-primary text-primary-content card">
            <div class="text-center card-body items-center">
              <h2 class="text-2xl card-title">Your Video Preview</h2>
              <div class="rounded-2xl">
                <VideoPreview {us} />
              </div>
            </div>
          </div>
        </div>

        <!--Next Column-->
        <div class="space-y-6 lg:col-start-3 lg:col-span-1">
          <!-- Status -->
          <div class="lg:col-start-3 lg:col-span-1">
            <div class="bg-primary text-primary-content card">
              <div class="text-center card-body items-center">
                <h2 class="text-2xl card-title">Call Status</h2>
                {#if ready4Call}
                  <div class="text-2xl">Waiting for Incoming Call</div>
                {:else}
                  <p>Signed in as {talentObj.name}</p>
                {/if}
                <p>Call State: {callMachineState.value}</p>
                {#if linkMachineState}<p>
                    Link State:{JSON.stringify(linkMachineState.value)}
                  </p>{/if}
              </div>
            </div>
          </div>
          <!-- Photo -->
          <div>
            <div class="lg:col-start-3 lg:col-span-1">
              <div class="bg-primary text-primary-content card">
                <div class="text-center card-body items-center">
                  <h2 class="text-3xl card-title">{talentObj.name}</h2>
                  <div>
                    <ProfilePhoto
                      profileImage={talentObj.profileImageUrl ||
                        PUBLIC_DEFAULT_PROFILE_IMAGE}
                      callBack={value => {
                        updateProfileImage(value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Wallet -->
          <div>
            <TalentWallet {talent} />
          </div>

          <!-- Feedback -->
          <div>
            <div class="lg:col-start-3 lg:col-span-1">
              <div class="bg-primary text-primary-content card">
                <div class="text-center card-body items-center">
                  <h2 class="text-2xl card-title">Your Average Rating</h2>
                  {talentObj.stats.ratingAvg.toFixed(2)}
                  <StarRating rating={talentObj.stats.ratingAvg ?? 0} />
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div>
            <div class="lg:col-start-3 lg:col-span-1">
              <TalentActivity {completedCalls} />
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div>
        <VideoCall
          {vc}
          {us}
          options={{ hangup: false, cam: false, mic: false }}
        />
      </div>
    {/if}
  </main>
</div>
