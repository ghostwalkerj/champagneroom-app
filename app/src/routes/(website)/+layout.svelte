<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div class="bg-gradient-to-r from-indigo-600 to-[#000000] font-Roboto">
  <Navbar />
  <slot />
  <Footer />
</div>
