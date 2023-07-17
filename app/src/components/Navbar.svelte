<div class="navbar">
  <div class="navbar-start justify-between w-full sm:">
    <div class="dropdown">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label tabIndex={0} class="btn btn-ghost lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h8m-8 6h16"
          />
        </svg>
      </label>
      <ul
        tabIndex={0}
        class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <a>Item 1</a>
        </li>
        <li>
          <a>Parent</a>
          <ul class="p-2">
            <li>
              <a>Submenu 1</a>
            </li>
            <li>
              <a>Submenu 2</a>
            </li>
          </ul>
        </li>
        <li>
          <a>Item 3</a>
        </li>
      </ul>
    </div>
    <img alt="abc" src="/logo.png" class="ml-0 sm:ml-28 w-32" />
  </div>
  <div class="navbar-center hidden py-2 ml-72 lg:flex">
    <ul class="menu menu-horizontal px-4">
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#home"
        >
          Home
        </a>
      </li>
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#About"
        >
          About
        </a>
      </li>
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#Play"
        >
          P.L.A.Y
        </a>
      </li>
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#Tokenomics"
        >
          Tokenomics
        </a>
      </li>
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#Findus"
        >
          Find Us On
        </a>
      </li>
      <li>
        <a
          class="whitenav text-[#d0dce8] font-space-grotesk font-semibold text-base capitalize mt-3 ml-3 hover:text-[#54f6cd]"
          href="#"
        >
          Roadmap
        </a>
      </li>
      <!-- svelte-ignore a11y-missing-attribute -->
      <a
        class="font-SpaceGrotesk flex items-center font-semibold text-base capitalize no-underline leading-normal tracking-wide text-white bg-gradient-to-r from-[#28e0b27a] to-[#28e0b2b5] border border-[#28e0b2] rounded-[8px] shadow-[0px 0px 100px 0px rgba(38, 226, 179, 0.44)] px-3 py-3 mt-2 ml-3 hover:text-black"
      >
        Open App
      </a>
    </ul>
  </div>
  <div class="navbar-end hidden sm:block" />
</div>
