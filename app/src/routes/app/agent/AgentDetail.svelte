<script lang="ts">
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ProfileImage from '$components/forms/ImageUploadForm.svelte';
  import Config from '$lib/config';
  import type { AgentDocument } from '$lib/models/agent';
  import type { ActionResult } from '@sveltejs/kit';
  import urlJoin from 'url-join';

  export let agent: AgentDocument;

  let nameDiv: HTMLDivElement;
  let commissionDiv: HTMLDivElement;

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
          Config.PATH.referralSignup,
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
      const defaultCommissionRate = parseInt(commissionDiv.textContent);
      if (
        isNaN(defaultCommissionRate) ||
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
    Config.PATH.referralSignup,
    referralCode
  );
</script>

<div>
  <div class="lg:col-start-3 lg:col-span-1">
    <div class="bg-primary text-primary-content daisy-card">
      <div class="text-center daisy-card-body items-center p-3">
        <div class="flex flex-col gap-4">
          <div
            class="text-2xl font-bold w-full text-center"
            contenteditable="true"
            on:blur={updateAgent}
            bind:this={nameDiv}
          >
            {agent.user.name}
          </div>
          <div class="flex w-full place-content-center">
            <div class="font-bold pr-1">Default Commission:</div>
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
              imageUrl={agent.user.profileImageUrl ||
                Config.UI.defaultProfileImage}
              callBack={(value) => {
                updateProfileImage(value);
              }}
            />
          </div>
          <div>
            <div class="font-bold pr-1">Referral Url:</div>
            <div>
              <a class="daisy-link" href={referralUrl}> {referralCode}</a>
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="daisy-btn daisy-btn-xs" on:click={updateReferralCode}>
              Change
            </div>
          </div>
          <div class="flex w-full place-content-center">
            <div class="font-bold pr-1">Referral Count:</div>
            <div>{referralCount}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
