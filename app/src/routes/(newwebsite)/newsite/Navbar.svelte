<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="navbar">
  <div class="navbar-start justify-between w-full sm:">
    <img
      alt="abc"
      src="{PUBLIC_STATIC_URL}/assets/cr_logo.png"
      class="ml-0 sm:ml-28 w-32"
    />
  </div>
  <div class="navbar-center hidden py-2 ml-72 lg:flex">
    <ul class="menu menu-horizontal px-4">
      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#home">Home</a
        >
      </li>
      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#About"
        >
          About
        </a>
      </li>
      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#GetStarted"
        >
          Get Started
        </a>
      </li>
      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#FAQ"
        >
          FAQ
        </a>
      </li>

      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#SignUp"
        >
          Sign Up
        </a>
      </li>

      <li>
        <a
          class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
          href="#ContactUs"
        >
          Community
        </a>
      </li>
      <a
        class="font-['SpaceGrotesk'] flex items-center btn mt-2 ml-6 btn-outline btn-primary"
        href="/agent"
      >
        Open App
      </a>
    </ul>
  </div>
  <div class="navbar-end hidden sm:block" />
</div>
