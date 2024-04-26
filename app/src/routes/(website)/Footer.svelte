<script lang="ts">
  import Icon from '@iconify/svelte';

  import config from '$lib/config';
</script>

<footer class="mt-20 w-full flex-shrink-0 px-4 md:px-6 lg:px-10">
  <div class="flex w-full flex-col justify-center pb-6 lg:flex-row">
    <div
      class="mx-auto flex w-full flex-col whitespace-nowrap text-center md:flex-row md:justify-evenly md:space-x-4"
    >
      <div class="mb-6 md:mb-0">
<<<<<<< Updated upstream
        <h5 class="mb-3 text-secondary-500">Social</h5>
=======
        <h5 class="text-info mb-3">Social</h5>
>>>>>>> Stashed changes
        <ul class="list-none">
          <li class="spa">
            <a href="https://discord.gg/VgB7bWScVa" target="_blank">
              <div class="flex gap-2">
                <Icon icon="line-md:discord-twotone" />
                <span class="icon-list-text">Discord</span>
              </div>
            </a>
          </li>
          <li class="spa">
            <a href="https://twitter.com/_Champagne_Room" target="_blank">
              <div class="flex gap-2">
                <Icon icon="simple-icons:x" />
                <span class="icon-list-text">(Twitter)</span>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="mb-6 md:mb-0">
<<<<<<< Updated upstream
        <h5 class="mb-3 text-secondary-500">Services</h5>
=======
        <h5 class="text-info mb-3">Services</h5>
>>>>>>> Stashed changes
        <ul class="list-none">
          <li class="spa">
            <a href={config.PATH.creator}>Creators</a>
          </li>
          <li class="spa">
            <a href={config.PATH.agent}>Management</a>
          </li>
        </ul>
      </div>
      <div class="">
<<<<<<< Updated upstream
        <h5 class="mb-3 text-secondary-500">Learn</h5>
=======
        <h5 class="text-info mb-3">Learn</h5>
>>>>>>> Stashed changes
        <ul class="list-none">
          <li class="spa">
            <a
              href="{config.PATH
                .staticUrl}/assets/champagne-room-white-paper.pdf"
              >White Paper</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</footer>
