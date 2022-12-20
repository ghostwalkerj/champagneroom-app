<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';

  import {
    publicShowDB,
    type PublicShowDBType,
  } from '$lib/ORM/dbs/publicShowDB';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import getProfileImage from '$lib/util/profilePhoto';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import ShowDetail from './ShowDetail.svelte';

  export let form: import('./$types').ActionData;
  export let data: PageData;

  const token = data.token;
  let show = data.show;
  let displayName = data.displayName;
  let showId = $page.params.id;

  $: waiting4StateChange = false;
  $: profileImage = getProfileImage(displayName);

  publicShowDB(token, showId, StorageTypes.IDB).then((db: PublicShowDBType) => {
    db.shows.findOne(showId).$.subscribe(_show => {
      if (_show) {
        // Here is where we run the machine and do all the logic based on the state
        // linkService = createLinkMachineService(_show.linkState);
        // linkService.subscribe(state => {
        //   linkMachineState = state;
        // });
      }
      show = _show as ShowDocument;
      waiting4StateChange = false;
    });
  });

  const onSubmit = ({ form }) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      } else {
        if (form) form.reset();
      }
      await applyAction(result);
    };
  };

  // Wait for onMount to grab user Stream only if we plan to call or do we grab to to make sure it works?
  onMount(async () => {});
</script>

<div class="grid grid-flow-row place-content-center">
  <!-- Page header -->
  <div class="text-center">
    <h1 class="font-bold text-center text-5xl p-4">
      Welcome to the Champagne Room
    </h1>
  </div>
  <div class="grid place-content-center">
    <ShowDetail {show} />
  </div>
</div>
