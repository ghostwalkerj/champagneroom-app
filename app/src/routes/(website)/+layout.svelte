<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div class="bg-gradient-to-r from-[#0C082E] to-[#0C092E]">
  <Navbar />
  <slot />
  <Footer />
</div>
