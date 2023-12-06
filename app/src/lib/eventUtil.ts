import * as timeago from 'timeago';

import type { ShowEventDocumentType } from '$lib/models/showEvent';

import { ShowMachineEventString } from './machines/showMachine';

export const createEventText = (
  showEvent: ShowEventDocumentType | undefined
) => {
  if (showEvent === undefined) {
    return 'No Events';
  }
  let eventText =
    timeago.format(showEvent.createdAt) +
      ' ' +
      showEvent.ticketInfo?.customerName ?? 'someone';

  switch (showEvent.type) {
    case ShowMachineEventString.TICKET_SOLD: {
      eventText += ' paid in full!';
      break;
    }

    case ShowMachineEventString.TICKET_RESERVED: {
      eventText += ' reserved a ticket!';
      break;
    }

    case ShowMachineEventString.TICKET_CANCELLED: {
      eventText += ' cancelled the ticket';
      break;
    }

    case ShowMachineEventString.TICKET_REFUNDED: {
      eventText += ' refunded';
      break;
    }

    case ShowMachineEventString.TICKET_DISPUTED: {
      eventText += ' disputed the ticket';
      break;
    }

    case ShowMachineEventString.CUSTOMER_JOINED: {
      eventText += ' joined the show';
      break;
    }

    case ShowMachineEventString.CUSTOMER_LEFT: {
      eventText += ' left the show';
      break;
    }

    default: {
      eventText = 'No Events';
    }
  }

  return eventText;
};
