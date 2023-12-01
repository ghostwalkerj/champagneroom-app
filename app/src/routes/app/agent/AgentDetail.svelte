<script lang="ts">
  import type { AgentDocumentType } from '$lib/models/agent';
  import Config from '$lib/config';
  import ProfilePhoto from '$components/ProfilePhoto.svelte';
  import urlJoin from 'url-join';
  import { page } from '$app/stores';

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
  $: defaultCommission = agent.defaultCommission;
  $: referralCode = agent.user.referralCode;
  $: referralUrl = urlJoin(
    $page.url.origin,
    Config.Path.referralSignup,
    referralCode
  );
</script>

<div>
  <div class="lg:col-start-3 lg:col-span-1">
    <div class="bg-primary text-primary-content card">
      <div class="text-center card-body items-center p-3">
        <div class="flex flex-col gap-4">
          <div
            class="text-2xl font-bold w-full text-center"
            contenteditable="true"
          >
            {agent.user.name}
          </div>
          <div class="flex w-full place-content-center">
            <div class="font-bold">Default Commission:</div>
            <div contenteditable="true">{defaultCommission}</div>
            <div>%</div>
          </div>
          <div>
            <ProfilePhoto
              profileImage={agent.user.profileImageUrl ||
                Config.UI.defaultProfileImage}
              callBack={(value) => {
                updateProfileImage(value);
              }}
            />
          </div>
          <div>
            <div class="font-bold">Referral Url:</div>
            <div>
              <a class="link" href={referralUrl}> {referralCode}</a>
            </div>
            <div class="btn btn-xs">Change</div>
          </div>
          <div class="flex w-full place-content-center">
            <div class="font-bold">Referral Count:</div>
            <div>0</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
