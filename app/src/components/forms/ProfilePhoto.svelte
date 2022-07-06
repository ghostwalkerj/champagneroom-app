<script type="ts">
	// TODO:Add validation

	import { browser } from '$app/env';
	import { filedrop } from 'filedrop-svelte';
	import Image from 'svelte-image';
	import { scale } from 'svelte/transition';

	export let profileImage: string;
	export let callBack: (arg0: string) => void;

	let uploadVisibility = 'invisible';
	let progressVisibility = 'invisible';
	let file: File;
	const SKYNET_URL = (import.meta.env.VITE_SKYNET_URL as string) || 'https://siasky.net';

	let options = {
		fileLimit: 1,
		maxSize: 1048576,
		accept: ['image/png', 'image/jpeg'],
		multiple: false
	};

	$: update = false;
	$: imageUrl = profileImage;
	$: uploadReady = false;
	$: uploadProgress = 0;

	function onChange(e: CustomEvent) {
		const files = e.detail.files.accepted;
		if (files.length > 0) {
			file = files[0];
			if (file) {
				uploadVisibility = 'invisible';
				uploadReady = true;
				const reader = new FileReader();
				reader.addEventListener('load', function () {
					imageUrl = reader.result as string;
				});
				reader.readAsDataURL(file);
				return;
			}
		}
	}

	function setUpdate(value: boolean) {
		update = value;
		uploadVisibility = value ? 'visible' : 'invisible';
		uploadReady = false;
		imageUrl = profileImage;
	}

	function resetForm() {
		update = false;
		uploadVisibility = 'invisible';
		uploadReady = false;
		imageUrl = profileImage;
		progressVisibility = 'invisible';
	}

	// TODO: Have to make this secure before going live, convert to endpoint and proxy via the server

	async function upload() {
		if (browser) {
			uploadVisibility = 'invisible';
			progressVisibility = 'visible';
			const { SkynetClient } = await import('skynet-js');
			try {
				const client = new SkynetClient(SKYNET_URL);
				const { skylink } = await client.uploadFile(file, { onUploadProgress });
				const skylinkUrl = await client.getSkylinkUrl(skylink); // TODO:Abstract the domain to allow muttiple domains
				profileImage = skylinkUrl;
				callBack(skylinkUrl);
				progressVisibility = 'invisible';
				uploadProgress = 0;
			} catch (error) {
				console.log(error);
			}
		}
		resetForm();
	}

	const onUploadProgress = (progress: number) => {
		uploadProgress = Math.round(progress * 100);
	};
</script>

<div class="p-4">
	<div
		class="container rounded-full flex-none h-50 text-center w-50 relative  items-center mask-circle"
		in:scale
	>
		<div>
			<Image src={imageUrl || ' '} alt="" class="rounded-full flex-none object-cover mask-circle" />
		</div>
		<div
			use:filedrop={options}
			on:filedrop={onChange}
			class="absolute inset-0 flex flex-col justify-center z-10 bg-gray-500 opacity-75 rounded-full h-50 items-center w-50 {uploadVisibility}"
		>
			<div class="self-center">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50"
					><path fill="none" d="M0 0h24v24H0z" /><path
						d="M1 14.5a6.496 6.496 0 0 1 3.064-5.519 8.001 8.001 0 0 1 15.872 0 6.5 6.5 0 0 1-2.936 12L7 21c-3.356-.274-6-3.078-6-6.5zm15.848 4.487a4.5 4.5 0 0 0 2.03-8.309l-.807-.503-.12-.942a6.001 6.001 0 0 0-11.903 0l-.12.942-.805.503a4.5 4.5 0 0 0 2.029 8.309l.173.013h9.35l.173-.013zM13 13v4h-2v-4H8l4-5 4 5h-3z"
					/></svg
				>
			</div>
			<div class="self-center">
				<p>Click or Drag & Drop Image</p>
			</div>
		</div>
	</div>
	<div
		class="absolute m-4 inset-0 flex flex-col justify-center items-center z-10 bg-gray-500 opacity-75 rounded-xl {progressVisibility}"
	>
		<div class="text-primary radial-progress" style="--value:{uploadProgress}">
			{uploadProgress}%
		</div>
	</div>
</div>

{#if !update}
	<div class="justify-center card-actions last:my-2">
		<button
			class="btn btn-xs btn-secondary md:btn-sm"
			on:click={() => {
				setUpdate(true);
			}}
		>
			Change Photo
		</button>
	</div>
{:else}
	<div class="justify-center card-actions last:my-2">
		{#if !uploadReady}
			<label
				class="custom-file-upload btn  btn-xs btn-secondary md:btn-sm"
				use:filedrop={options}
				on:filedrop={onChange}
			>
				<input type="file" class="hidden" />
				Choose Image
			</label>
		{:else}
			<button class="btn btn-xs btn-secondary md:btn-sm" on:click={(e) => upload()}> Upload</button>
		{/if}
		<button class="btn btn-xs btn-outline btn-secondary md:btn-sm" on:click={resetForm}>
			Cancel</button
		>
	</div>
{/if}
