<script lang="ts">
	import type { UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onDestroy,onMount } from 'svelte';

	import {
	MicIcon,
	MicOffIcon,
	PhoneCallIcon,
	PhoneIcon,
	PhoneIncomingIcon,
	PhoneMissedIcon,
	PhoneOutgoingIcon,
	VideoIcon,
	VideoOffIcon
	} from 'svelte-feather-icons';
	import MdClose from 'svelte-icons/md/MdClose.svelte';

	export let vc: Awaited<VideoCallType>;
	export let us: Awaited<UserStreamType>;
	export let options: Partial<{
		makeCall: boolean;
		rejectCall: boolean;
		answerCall: boolean;
		hangup: boolean;
		cam: boolean;
		mic: boolean;
		cancel: boolean;
	}> = {};
	let mediaStream: MediaStream;

	const buttonOptions = Object.assign(
		{
			makeCall: true,
			rejectCall: true,
			answerCall: true,
			hangup: true,
			cam: true,
			mic: true,
			cancel: true
		},
		options
	);

	const callState = vc.callState;
	const micState = us.micState;
	const camState = us.camState;

	// UI Controls
	let canvas: HTMLCanvasElement;
	let localVideo: HTMLVideoElement;
	let remoteVideo: HTMLVideoElement;

	// Video Control
	let filters;
	const frame = {
		translate: [2, 2]
	};
	let target: HTMLDivElement;
	let Moveable: any;

	onMount(async () => {
		Moveable = (await import('svelte-moveable')).default;

		canvas.width = localVideo.width;
		canvas.height = localVideo.height;
		filters = document.querySelector('.filters');
		initalize();
	});

	onDestroy(() => {
		if (remoteVideo) {
			remoteVideo.pause();
		}
	});

	if (us) {
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	}

	const initalize = () => {
		if (localVideo) {
			localVideo.srcObject = mediaStream;
			remoteVideo.load();
			localVideo.play();
		}
		vc.callState.subscribe((s) => {
			switch (s) {
				case 'ready':

				case 'connectedAsCaller':
				case 'connectedAsReceiver':
					vc.remoteStream.subscribe((stream) => {
						if (stream && remoteVideo) {
							remoteVideo.srcObject = stream;
							remoteVideo.load();
							remoteVideo.play();
						}
					});

					break;
			}
		});
	};
</script>

<svelte:component
	this={Moveable}
	draggable={true}
	resizable={true}
	keepRatio={true}
	{target}
	throttleDrag={0}
	on:dragStart={({ detail: { set } }) => {
		set(frame.translate);
	}}
	on:drag={({ detail: { target, beforeTranslate } }) => {
		frame.translate = beforeTranslate;
		target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
	}}
	on:dragEnd={({ detail: { target, isDrag, clientX, clientY } }) => {}}
	on:resizeStart={({ detail: { target, set, setOrigin, dragStart } }) => {
		// Set origin if transform-origin use %.
		setOrigin(['%', '%']);

		// If cssSize and offsetSize are different, set cssSize. (no box-sizing)
		const style = window.getComputedStyle(target);
		const cssWidth = parseFloat(style.width);
		const cssHeight = parseFloat(style.height);
		set([cssWidth, cssHeight]);

		// If a drag event has already occurred, there is no dragStart.
		dragStart && dragStart.set(frame.translate);
	}}
	on:resize={({ detail: { target, width, height, drag } }) => {
		target.style.width = `${width}px`;
		target.style.height = `${height}px`;

		// get drag event
		frame.translate = drag.beforeTranslate;
		target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`;
	}}
	on:resizeEnd={({ detail: { target, isDrag, clientX, clientY } }) => {}}
/>

<div class="w-full">
	<section
		class="h-full bg-base-100  grid grid-cols-1 grid-rows-1 grow overflow-hidden md:border-2  md:rounded-2xl"
	>
		<div class="flex flex-col m-2 relative">
			<div class="rounded-xl border-2 h-68 p-2 w-120 z-10 absolute" bind:this={target}>
				<video bind:this={localVideo} playsinline autoplay>
					<track kind="captions" />
				</video>
			</div>

			<div class="h-full w-full align-top">
				<video bind:this={remoteVideo} playsinline autoplay class="h-full object-cover w-full">
					<track kind="captions" />
				</video>
			</div>
			<canvas bind:this={canvas} />
		</div>
	</section>

	<section
		class="flex bg-base-100 flex-shrink-0 p-4 gap-4 items-center justify-center md:rounded-2xl md:gap-8 dark:bg-dark-eval-1"
	>
		<div class="flex flex-col gap-2 items-center">
			{#if $callState == 'ready'}
				<button disabled={!buttonOptions.makeCall} class="h-14 w-14 btn btn-circle">
					<PhoneIcon size="34" />
				</button>
				Call
			{:else if $callState == 'makingCall'}
				<button
					class="h-14 animate-flash animate-loop w-14 animated  btn btn-circle"
					disabled={!buttonOptions.makeCall}
				>
					<PhoneOutgoingIcon size="34" />
				</button>
				Waiting
			{:else if $callState == 'receivingCall'}
				<button
					class="h-14 animate-shock animate-loop w-14 animated  btn btn-circle"
					on:click={() => vc.acceptCall(mediaStream)}
					disabled={!buttonOptions.answerCall}
				>
					<PhoneIncomingIcon size="34" />
				</button>
				Answer
			{:else}
				<button class="h-14 w-14 btn btn-circle" disabled={true}>
					<PhoneCallIcon size="34" />
				</button>
				In Call
			{/if}
		</div>

		<div class="flex flex-col gap-2 items-center">
			<button
				class="h-14 w-14 btn btn-circle "
				on:click={camState.toggleCam}
				disabled={!buttonOptions.cam}
			>
				{#if $camState === 'CamOn'}
					<VideoIcon size="34" />
				{:else}
					<VideoOffIcon size="34" />
				{/if}
			</button>
			Cam
		</div>

		<div class="flex flex-col gap-2 items-center">
			<button
				class="h-14 w-14 btn btn-circle"
				on:click={micState.toggleMic}
				disabled={!buttonOptions.mic}
			>
				{#if $micState === 'MicOn'}
					<MicIcon size="34" />
				{:else}
					<MicOffIcon size="34" />
				{/if}
			</button>
			Mic
		</div>

		<div class="flex flex-col gap-2 items-center">
			{#if $callState == 'receivingCall'}
				<button
					class="h-14 w-14 btn-primary btn btn-circle"
					on:click={() => vc.rejectCall()}
					disabled={!buttonOptions.rejectCall}
				>
					<PhoneMissedIcon size="34" />
				</button>
				Reject
			{:else if $callState == 'makingCall'}
				<button
					class="h-14 w-14 btn btn-circle btn-primary"
					on:click={() => vc.cancelCall()}
					disabled={!buttonOptions.rejectCall}
				>
					<PhoneMissedIcon size="34" />
				</button>
				Cancel
			{:else if $callState == 'connectedAsCaller' || $callState == 'connectedAsReceiver'}
				<button
					class="h-14 w-14 btn btn-circle btn-primary"
					on:click={() => vc.hangUp()}
					disabled={!buttonOptions.hangup}
				>
					<PhoneMissedIcon size="34" />
				</button>
				Hangup
			{:else}
				<button
					class="h-14 w-14 btn btn-primary btn-circle"
					on:click={() => vc.cancelCall()}
					disabled={!buttonOptions.hangup}
				>
					<div class="h-8 w-8"><MdClose /></div></button
				>
				Leave
			{/if}
		</div>
	</section>
	Call State: {$callState || ''} <br />
</div>

<style>
	:global .moveable-control.moveable-origin {
		visibility: hidden !important;
		border: 0 !important;
	}

	:global .moveable-line {
		visibility: hidden !important;
	}

	:global .moveable-control {
		border: 0 !important;
		opacity: 0 !important;
	}
</style>
