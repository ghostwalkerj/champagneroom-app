<script lang="ts">
  import TransactionsActivity from '$components/TransactionsActivity.svelte';
  import CRUDRoomForm from '$components/modals/CRUDRoomForm.svelte';
  import DecideDispute from '$components/modals/DecideDispute.svelte';
  import EndShowForm from '$components/modals/EndShowForm.svelte';
  import PayoutForm from '$components/modals/PayoutForm.svelte';
  import ReserveShowForm from '$components/modals/ReserveTicketForm.svelte';
  import UserSecret from '$components/modals/UserSecret.svelte';
  import '@fontsource/roboto';
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';
  import '@fontsource/roboto/900.css';

  import {
    arrow,
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift
  } from '@floating-ui/dom';
  import '@fontsource/space-grotesk';
  import type { ModalComponent } from '@skeletonlabs/skeleton';
  import {
    Drawer,
    Modal,
    initializeStores,
    storePopup
  } from '@skeletonlabs/skeleton';
  import '../app.css';
  initializeStores();
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  const modalRegistry: Record<string, ModalComponent> = {
    // Set a unique modal ID, then pass the component reference
    ReserveShowForm: { ref: ReserveShowForm },
    PayoutForm: { ref: PayoutForm },
    TransactionsActivity: { ref: TransactionsActivity },
    EndShowForm: { ref: EndShowForm },
    CRUDRoomForm: { ref: CRUDRoomForm },
    UserSecret: { ref: UserSecret },
    DecideDispute: { ref: DecideDispute }
  };
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />
<Drawer />

<slot />
