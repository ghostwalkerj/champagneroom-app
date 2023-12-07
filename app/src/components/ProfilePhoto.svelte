<script lang="ts">
  // TODO:Add validation
  import { filedrop } from 'filedrop-svelte';
  import urlJoin from 'url-join';

  import { page } from '$app/stores';

  import Config from '$lib/config';

  export let callBack: (argument0: string) => void;
  export let profileImage: string;

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
  $: imageUrl = profileImage;
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
    imageUrl = profileImage;
  }

  function resetForm() {
    update = false;
    uploadVisibility = 'invisible';
    uploadReady = false;
    imageUrl = profileImage;
    progressVisibility = 'invisible';
  }

  async function upload() {
    uploadVisibility = 'invisible';
    progressVisibility = 'visible';
    let formData = new FormData();
    formData.append('file', file);
    const uploadUrl = urlJoin($page.url.origin, Config.Path.imageUpload);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    profileImage = data.url;
    callBack(profileImage);
    progressVisibility = 'invisible';
    resetForm();
  }
</script>

<div class="flex flex-col items-center lg:h-[200px]">
  <div class="p-4">
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="32"
            height="32"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M1 14.5a6.496 6.496 0 0 1 3.064-5.519 8.001 8.001 0 0 1 15.872 0 6.5 6.5 0 0 1-2.936 12L7 21c-3.356-.274-6-3.078-6-6.5zm15.848 4.487a4.5 4.5 0 0 0 2.03-8.309l-.807-.503-.12-.942a6.001 6.001 0 0 0-11.903 0l-.12.942-.805.503a4.5 4.5 0 0 0 2.029 8.309l.173.013h9.35l.173-.013zM13 13v4h-2v-4H8l4-5 4 5h-3z"
            />
          </svg>
        </div>
        <div class="self-center text-center">
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
        class="daisy-btn daisy-btn-xs daisy-btn-secondary daisy-btn-outline lg:btn-sm"
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
          class="custom-file-upload daisy-btn daisy-btn-xs daisy-btn-outline daisy-btn-secondary"
          use:filedrop={options}
          on:filedrop={onChange}
        >
          <input type="file" class="hidden" />
          Select Image
        </label>
      {:else}
        <button
          class="daisy-btn daisy-btn-xs daisy-btn-outline daisy-btn-secondary"
          on:click={() => upload()}
        >
          Upload
        </button>
      {/if}
      <button
        class="daisy-btn daisy-btn-xs daisy-btn-outline daisy-btn-secondary"
        on:click={resetForm}
      >
        Cancel
      </button>
    </div>
  {/if}
</div>
