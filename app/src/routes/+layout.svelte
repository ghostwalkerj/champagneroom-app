<script lang="ts">
  import '@fontsource/roboto';
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';
  import '@fontsource/space-grotesk';
  import 'iconify-icon';
  import '../app.css';
  import { Modal } from '@skeletonlabs/skeleton';
  import type { ModalComponent } from '@skeletonlabs/skeleton';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import ReserveShowForm from '$components/forms/ReserveShowForm.svelte';

initializeStores();
const modalRegistry: Record<string, ModalComponent> = {
	// Set a unique modal ID, then pass the component reference
	ReserveShowForm: { ref: ReserveShowForm }
	// ...
};
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />

<slot />
