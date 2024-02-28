<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div
  class="min-h-screen bg-gradient-to-r from-[#0C082E] to-[#0C092E] font-Roboto"
>
  <div class="sticky top-0 z-40">
    <Navbar />
  </div>

  <div class="m-auto max-w-7xl">
    <slot />
  </div>

  <Footer />
</div>
