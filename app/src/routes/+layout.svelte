<script lang="ts">
  import ReserveShowForm from '$components/forms/ReserveShowForm.svelte';
  import '@fontsource/roboto';
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';
  import '@fontsource/space-grotesk';
  import type { ModalComponent } from '@skeletonlabs/skeleton';
  import { Modal, initializeStores } from '@skeletonlabs/skeleton';
  import '../app.css';

initializeStores();
const modalRegistry: Record<string, ModalComponent> = {
	// Set a unique modal ID, then pass the component reference
	ReserveShowForm: { ref: ReserveShowForm }
	// ...
};
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />

<slot />
