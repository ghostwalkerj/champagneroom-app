<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import MobileVideoCall from '$lib/components/calls/MobileVideoCall.svelte';
	import { callMachine } from '$lib/machines/callMachine';
	import { createLinkMachineService, type LinkMachineServiceType } from '$lib/machines/linkMachine';
	import { CallEventType } from '$lib/ORM/models/callEvent';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onDestroy, onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import type { Subscription } from 'xstate';
	import type { PageData } from './$types';

	import MobileVideoPreview from '$lib/components/calls/MobileVideoPreview.svelte';
	import type { EventObject } from 'xstate';
	import { goto } from '$app/navigation';
	import urlJoin from 'url-join';
	import { PUBLIC_MOBILE_PATH, PUBLIC_TALENT_PATH } from '$env/static/public';
	import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
	import { StorageTypes } from '$lib/ORM/rxdb';

	export let data: PageData;

	$: currentLink = data.currentLink as LinkDocument;
	const token = data.token;

	let key = $page.params.key;
	let vc: VideoCallType;
	let linkService: LinkMachineServiceType;
	let linkSub: Subscription;
	let linkStateSub: Subscription;

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

	const BASE_PATH = urlJoin(PUBLIC_MOBILE_PATH, PUBLIC_TALENT_PATH, key);

	if (browser) {
		talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
			db.links
				.findOne(currentLink._id)
				.exec()
				.then((link) => {
					if (link) {
						currentLink = link;
						useLink(link);
					}
				})
				.catch((err) => {
					console.error(err);
				});
		});
	}

	const useLinkState = (link: LinkDocument, linkState: LinkDocument['linkState']) => {
		if (linkService) linkService.stop();
		if (linkSub) linkSub.unsubscribe();

		linkService = createLinkMachineService(linkState, link.updateLinkStateCallBack());
		linkSub = linkService.subscribe(async (state) => {
			linkMachineState = state;
			if (state.changed && !state.matches('claimed.canCall')) {
				if (linkService) linkService.stop();
				if (linkSub) linkSub.unsubscribe();
				if (linkStateSub) linkStateSub.unsubscribe();
				console.log('goto', BASE_PATH);
				await goto(BASE_PATH);
			}
		});
	};

	const useLink = (link: LinkDocument) => {
		initVC(link.callId);
		useLinkState(link, link.linkState);
		linkStateSub = link.get$('linkState').subscribe((_linkState) => {
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
			<MobileVideoCall {vc} {us} options={{ hangup: false, cam: false, mic: false }} />
		</div>
	{:else}
		<!-- Video Preview -->
		<div class="flex flex-col text-center w-full">
			<p class="text-2xl font-bold p-2">Video Preview</p>
			<MobileVideoPreview {us} />
		</div>
	{/if}
</div>
