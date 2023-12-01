<script lang="ts">
  import type { AgentDocumentType } from '$lib/models/agent';
  import Config from '$lib/config';
  import ProfilePhoto from '$components/ProfilePhoto.svelte';

  export let agent: AgentDocumentType;

  const updateProfileImage = async (url: string) => {
    if (url && agent) {
      agent.user.profileImageUrl = url;
      let formData = new FormData();
      formData.append('url', url);
      await fetch('?/update_profile_image', {
        method: 'POST',
        body: formData
      });
    }
  };

  $: name = agent.user.name;
</script>

<div>
  <div class="lg:col-start-3 lg:col-span-1">
    <div class="bg-primary text-primary-content card">
      <div class="text-center card-body items-center p-3">
        <h2 class="text-xl card-title" contenteditable="true">
          {name}
        </h2>
        <div>
          <ProfilePhoto
            profileImage={agent.user.profileImageUrl ||
              Config.UI.defaultProfileImage}
            callBack={(value) => {
              updateProfileImage(value);
            }}
          />
        </div>
      </div>
    </div>
  </div>
</div>
