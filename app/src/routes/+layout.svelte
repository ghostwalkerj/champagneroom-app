<script lang="ts">
  import '@fontsource/roboto';
  import '@fontsource/roboto/300.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/700.css';
  import '@fontsource/roboto/900.css';
  import '@fontsource/space-grotesk';
  import '../app.css';

  import {
    arrow,
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift
  } from '@floating-ui/dom';
  import type { ModalComponent } from '@skeletonlabs/skeleton';
  import {
    Drawer,
    initializeStores,
    Modal,
    storePopup
  } from '@skeletonlabs/skeleton';

  import CRUDRoomForm from '$components/modals/CRUDRoomForm.svelte';
  import DecideDispute from '$components/modals/DecideDispute.svelte';
  import EndShowForm from '$components/modals/EndShowForm.svelte';
  import PayoutForm from '$components/modals/PayoutForm.svelte';
  import ReserveShowForm from '$components/modals/ReserveTicketForm.svelte';
  import TicketFeedback from '$components/modals/TicketFeedback.svelte';
  import UserSecret from '$components/modals/UserSecret.svelte';
  import TransactionsActivity from '$components/TransactionsActivity.svelte';
  import TicketDispute from '$components/modals/TicketDispute.svelte';

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
    DecideDispute: { ref: DecideDispute },
    TicketFeedback: { ref: TicketFeedback },
    TicketDispute: { ref: TicketDispute }
  };
</script>

<Modal components={modalRegistry} regionBackdrop="bg-black/50" />
<Drawer />

<slot />
