<script>
  import Participant from '../Participant';

  export let conferenceId;
  export let conference;
  export let permitEntry = false;

  const participants = conference.participants;
  const status = conference.state;

  $: conference.permitEntry(permitEntry);
</script>

<div class="container">
  {#each Object.entries($participants) as [participantId, participant], key}
    <Participant {participant} />
  {/each}
</div>

<style>
  .container {
    margin-left: 2em;
    margin-bottom: 1em;
  }
</style>
