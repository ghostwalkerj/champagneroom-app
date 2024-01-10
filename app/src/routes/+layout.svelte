<script lang="ts">
  import ReserveShowForm from '$components/forms/ReserveShowForm.svelte';
  import CRUDRoomForm from '$components/forms/CRUDRoomForm.svelte';
  import WithdrawForm from '$components/forms/WithdrawForm.svelte';
  import TransactionsActivity from '$components/TransactionsActivity.svelte';
  import EndShowForm from '$components/forms/EndShowForm.svelte';
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
    ReserveShowForm: { ref: ReserveShowForm },
    WithdrawForm: { ref: WithdrawForm },
    TransactionsActivity: { ref: TransactionsActivity },
    EndShowForm: { ref: EndShowForm },
    CRUDRoomForm: { ref: CRUDRoomForm }

    // ...
  };
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />

<slot />
