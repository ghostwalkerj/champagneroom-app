<script lang="ts">
  // TODO:Add validation
  import { filedrop } from 'filedrop-svelte';
  import urlJoin from 'url-join';

  import { page } from '$app/stores';

  import config from '$lib/config';
  import Icon from '@iconify/svelte';

  export let callBack: (argument0: string) => void;
  export let imageUrl: string;

  let uploadVisibility = 'invisible';
  let progressVisibility = 'invisible';
  let file: File;

  let options = {
    fileLimit: 1,
    maxSize: 4_194_304,
    accept: ['image/*'],
    multiple: false
  };

  $: update = false;
  $: imageUrl = imageUrl;
  $: uploadReady = false;

  function onChange(event: CustomEvent) {
    const files = event.detail.files.accepted;
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
    imageUrl = imageUrl;
  }

  function resetForm() {
    update = false;
    uploadVisibility = 'invisible';
    uploadReady = false;
    imageUrl = imageUrl;
    progressVisibility = 'invisible';
  }

  async function upload() {
    uploadVisibility = 'invisible';
    progressVisibility = 'visible';
    let formData = new FormData();
    formData.append('file', file);
    const uploadUrl = urlJoin($page.url.origin, config.PATH.imageUpload);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    imageUrl = data.url;
    callBack(imageUrl);
    progressVisibility = 'invisible';
    resetForm();
  }
</script>

<div class="flex flex-col items-center lg:h-[200px]">
  <div class="p-2">
    <div
      class="bg-cover relative bg-no-repeat bg-center rounded-full lg:w-32 lg:h-32 w-24 h-24"
      style="background-image: url('{imageUrl}')"
    >
      <div
        use:filedrop={options}
        on:filedrop={onChange}
        class="absolute inset-0 flex flex-col justify-center z-10 bg-gray-500 opacity-75 rounded-full lg:h-32 lg:w-32 h-24 w-24 {uploadVisibility}"
      >
        <div class="self-center">
          <Icon icon="lets-icons:upload-light" class="h-12 w-12" />
        </div>
        <div class="self-center text-center font-bold">
          <p>Click or Drag & Drop Image</p>
        </div>
      </div>
    </div>
    <div
      class="absolute m-4 inset-0 flex flex-col justify-center items-center z-10 bg-gray-500 opacity-75 rounded-xl {progressVisibility}"
    />
  </div>
  {#if !update}
    <div class="justify-center daisy-card-actions last:my-2">
      <button
        class="btn variant-soft-secondary btn-sm neon-secondary"
        on:click={() => {
          setUpdate(true);
        }}
      >
        Change Photo
      </button>
    </div>
  {:else}
    <div class="justify-center daisy-card-actions last:my-2">
      {#if !uploadReady}
        <label
          class="custom-file-upload"
          use:filedrop={options}
          on:filedrop={onChange}
        >
          <input type="file" class="hidden" />
          <button class="btn btn-sm variant-soft-primary neon-primary"
            >Select Image</button
          >
        </label>
      {:else}
        <button
          class="btn btn-sm variant-soft-primary neon-primary"
          on:click={() => upload()}
        >
          Upload
        </button>
      {/if}
      <button class="btn btn-sm variant-soft-error" on:click={resetForm}>
        Cancel
      </button>
    </div>
  {/if}
</div>
