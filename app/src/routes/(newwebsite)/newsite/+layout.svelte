<script>
  import Footer from '$components/Footer.svelte';
  import Navbar from '$components/Navbar.svelte';
</script>

<div class="bg-black">
  <Navbar />
  <slot />
  <Footer />
</div>
