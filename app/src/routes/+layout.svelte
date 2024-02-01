<script lang="ts">
  import ReserveShowForm from '$components/modals/ReserveTicketForm.svelte';
  import CRUDRoomForm from '$components/modals/CRUDRoomForm.svelte';
  import PayoutForm from '$components/modals/PayoutForm.svelte';
  import TransactionsActivity from '$components/TransactionsActivity.svelte';
  import EndShowForm from '$components/modals/EndShowForm.svelte';
  import CreatorSecret from '$components/modals/CreatorSecret.svelte';
  import '@fontsource/roboto';
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';
  import '@fontsource/roboto/900.css';

  import '@fontsource/space-grotesk';
  import type { ModalComponent } from '@skeletonlabs/skeleton';
  import {
    Drawer,
    Modal,
    initializeStores,
    storePopup
  } from '@skeletonlabs/skeleton';
  import '../app.css';
  import {
    computePosition,
    autoUpdate,
    offset,
    shift,
    flip,
    arrow
  } from '@floating-ui/dom';
  initializeStores();
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  const modalRegistry: Record<string, ModalComponent> = {
    // Set a unique modal ID, then pass the component reference
    ReserveShowForm: { ref: ReserveShowForm },
    PayoutForm: { ref: PayoutForm },
    TransactionsActivity: { ref: TransactionsActivity },
    EndShowForm: { ref: EndShowForm },
    CRUDRoomForm: { ref: CRUDRoomForm },
    CreatorSecret: { ref: CreatorSecret }
  };
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />
<Drawer />

<slot />
