<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { ActionResult } from '@sveltejs/kit';
  import urlJoin from 'url-join';

  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { AgentDocument } from '$lib/models/agent';

  import config from '$lib/config';

  import CopyText from '$components/CopyText.svelte';
  import ProfileImage from '$components/ImageUploadForm.svelte';

  export let agent: AgentDocument;

  let nameDiv: HTMLDivElement;
  let commissionDiv: HTMLDivElement;

  const updateReferralCode = async () => {
    if (agent) {
      const response = await fetch('?/update_referral_code', {
        method: 'POST',
        body: new FormData()
      });
      const result: ActionResult = deserialize(await response.text());
      if (result.type === 'success' && result.data) {
        agent.user.referralCode = result.data.referralCode;
        invalidateAll();
        referralCode = agent.user.referralCode;
        referralUrl = urlJoin(
          $page.url.origin,
          config.PATH.referralSignup,
          referralCode
        );
        navigator.clipboard.writeText(referralUrl);
      }
    }
  };

  const updateAgent = async () => {
    if (!nameDiv.textContent || !commissionDiv.textContent) return;
    nameDiv.textContent = nameDiv.textContent.trim();
    commissionDiv.textContent = commissionDiv.textContent.trim();

    if (agent) {
      if (nameDiv.textContent.length < 3) {
        nameDiv.innerText = agent.user.name;
        return;
      }
      const defaultCommissionRate = Number.parseInt(commissionDiv.textContent);
      if (
        Number.isNaN(defaultCommissionRate) ||
        defaultCommissionRate < 0 ||
        defaultCommissionRate > 100
      ) {
        commissionDiv.innerText = agent.defaultCommissionRate.toString();
        return;
      }
      let formData = new FormData();
      formData.append('name', nameDiv.innerText);
      formData.append(
        'defaultCommissionRate',
        defaultCommissionRate.toString()
      );
      const response = await fetch('?/update_agent', {
        method: 'POST',
        body: formData
      });
      const result: ActionResult = deserialize(await response.text());
      if (result.type === 'success') {
        agent.user.name = nameDiv.innerText;
        agent.defaultCommissionRate = defaultCommissionRate;
        invalidateAll();
      }
    }
  };

  $: referralCode = agent.user.referralCode;
  $: referralCount = agent.user.referralCount || 0;
  $: referralUrl = urlJoin(
    $page.url.origin,
    config.PATH.referralSignup,
    referralCode
  );
</script>

<div
  class="bg-custom flex min-w-60 flex-col items-center justify-center gap-4 rounded p-4"
>
  <div class="flex flex-col items-center gap-0 text-center">
    <h2 class="flex items-center gap-2 text-xl font-semibold">
      <Icon class="text-secondary-500" icon="iconoir:profile-circle" />
      Profile
    </h2>
  </div>

  <div class="text-center">
    <div
      class="w-full text-center text-2xl font-bold"
      contenteditable="true"
      on:blur={updateAgent}
      bind:this={nameDiv}
    >
      {agent.user.name}
    </div>
    <div class="flex w-full place-content-center">
      <div class="pr-1 font-bold">Default Commission:</div>
      <div
        contenteditable="true"
        on:blur={updateAgent}
        bind:this={commissionDiv}
      >
        {agent.defaultCommissionRate}
      </div>
      <div>%</div>
    </div>
    <div>
      <ProfileImage
        imageUrl={agent.user.profileImageUrl || config.UI.defaultProfileImage}
        action="?/update_profile_image"
      />
    </div>
    <div>
      <div class="pr-1 pt-2 font-bold">Referral Url:</div>
      <div>
        <CopyText
          copyValue={referralUrl}
          class="neon-primary anchor variant-soft-primary mb-1 font-semibold"
        >
          <div slot="hoverText">Click to copy referral url</div>
          {referralCode}
        </CopyText>
      </div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <button
        class="neon-secondary variant-soft-secondary btn btn-sm m-2"
        on:click={updateReferralCode}
      >
        Change
      </button>
    </div>
    <div class="flex w-full place-content-center">
      <div class="pr-1 font-bold">Referral Count:</div>
      <div>{referralCount}</div>
    </div>
  </div>
</div>
