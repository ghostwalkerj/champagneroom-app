<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import VideoCall from '$lib/components/calls/VideoCall.svelte';
	import { callMachine } from '$lib/machines/callMachine';
	import { createLinkMachineService, type LinkMachineServiceType } from '$lib/machines/linkMachine';
	import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
	import { CallEventType } from '$lib/ORM/models/callEvent';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onDestroy, onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import type { Subscription } from 'xstate';
	import type { PageData } from './$types';

	import type { EventObject } from 'xstate';
	import MobileVideoPreview from '$lib/components/calls/MobileVideoPreview.svelte';

	export let data: PageData;
	const token = data.token;

	let talentObj = data.talent as TalentDocType;
	$: currentLink = data.currentLink as LinkDocument;
	let key = $page.params.key;
	let vc: VideoCallType;
	let talent: TalentDocument;
	let linkService: LinkMachineServiceType;
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
		currentLink && createLinkMachineService(currentLink.linkState).getSnapshot();

	const useLinkState = (link: LinkDocument, linkState: LinkDocument['linkState']) => {
		if (linkService) linkService.stop();
		if (linkSub) linkSub.unsubscribe();

		linkService = createLinkMachineService(linkState, link.updateLinkStateCallBack());
		linkSub = linkService.subscribe((state) => {
			linkMachineState = state;
		});
	};

	const useLink = (link: LinkDocument) => {
		currentLink = link;
		initVC(currentLink.callId);
		useLinkState(link, link.linkState);
		link.get$('linkState').subscribe((_linkState) => {
			useLinkState(link, _linkState);
		});
	};

	const answerCall = () => {
		showCallModal = false;
		vc.acceptCall(mediaStream);
	};

	const initVC = (callId: string) => {
		if (!browser) return;

		global = window;
		import('$lib/util/videoCall').then((_vc) => {
			videoCall = _vc.videoCall;
			vc = videoCall(callId);
			vc.callEvent.subscribe((ce) => {
				// Log call events on the Talent side
				if (ce) {
					callEvent = ce;
					let eventType: CallEventType | undefined;
					switch (ce.type) {
						case 'CALL INCOMING':
							eventType = CallEventType.ATTEMPT;
							break;

						case 'CALL ACCEPTED':
							eventType = CallEventType.ANSWER;
							break;

						case 'CALL CONNECTED':
							eventType = CallEventType.CONNECT;
							linkService.send('CALL CONNECTED');
							break;

						case 'CALL UNANSWERED':
							eventType = CallEventType.NO_ANSWER;
							break;

						case 'CALL REJECTED':
							eventType = CallEventType.REJECT;
							break;

						case 'CALL DISCONNECTED':
							eventType = CallEventType.DISCONNECT;
							linkService.send('CALL DISCONNECTED');
							break;

						case 'CALL HANGUP':
							eventType = CallEventType.HANGUP;
							break;
					}
					if (eventType !== undefined) {
						currentLink.createCallEvent(eventType).then((callEvent) => {
							linkService.send({ type: 'CALL EVENT RECEIVED', callEvent });
						});
					}
				}
			});

			vc.callMachineState.subscribe((cs) => {
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
			vc.callerName.subscribe((name) => {
				if (name) callerName = name;
			});
		});
	};

	onMount(async () => {
		us = await userStream();
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	});

	onDestroy(async () => {
		if (vc) vc.destroy();
	});

	if (browser) {
		talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
			db.talents
				.findOne(talentObj._id)
				.exec()
				.then((_talent) => {
					if (_talent) {
						talentObj = _talent;
						talent = _talent;
						talent.get$('currentLink').subscribe((linkId) => {
							if (linkId) {
								db.links
									.findOne(linkId)
									.exec()
									.then((link) => {
										if (link) useLink(link);
									});
							}
						});
					}
				});
		});
	}
</script>

<input type="checkbox" id="incomingcall-modal" class="modal-toggle" bind:checked={showCallModal} />
<div class="modal">
	<div class="modal-box">
		<div class="flex flex-row pt-4 gap-2 place-items-center justify-between">
			<div class="font-bold text-lg  ">Incoming pCall</div>
			<div class="h-14 animate-shock animate-loop w-14 animated  btn btn-circle ">
				<PhoneIncomingIcon size="34" />
			</div>
		</div>
		<p class="py-4">
			You have an incoming pCall from <span class="font-bold">{callerName}</span>
		</p>
		<div class="modal-action">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<label for="call-modal" class="btn" on:click={answerCall}>Answer</label>
		</div>
	</div>
</div>

<div class="flex">
	{#if inCall}
		<div>
			<VideoCall {vc} {us} options={{ hangup: false, cam: false, mic: false }} />
		</div>
	{:else}
		<!-- Video Preview -->
		<div class="flex flex-col text-center">
			<p class="text-2xl font-bold">Video Preview</p>
			<MobileVideoPreview {us} />
		</div>
	{/if}
</div>
