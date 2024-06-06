import * as timeago from 'timeago.js';

import type { ShowEventDocumentType } from '$lib/models/showEvent';

import type { ShowMachineEventType } from './machines/showMachine';

export const createEventText = (
  showEvent: ShowEventDocumentType | undefined
) => {
  const name = showEvent?.ticketInfo?.customerName || 'someone';
  if (showEvent === undefined) {
    return 'No Events';
  }
  let eventText = timeago.format(showEvent.createdAt) + ' ' + name;

  switch (showEvent.type as ShowMachineEventType['type']) {
    case 'TICKET SOLD': {
      eventText += ' paid in full!';
      break;
    }

    case 'TICKET RESERVED': {
      eventText += ' reserved a ticket!';
      break;
    }

    case 'TICKET CANCELLED': {
      eventText += ' cancelled the ticket';
      break;
    }

    case 'TICKET REFUNDED': {
      eventText += ' refunded';
      break;
    }

    case 'TICKET DISPUTED': {
      eventText += ' disputed the ticket';
      break;
    }

    case 'CUSTOMER JOINED': {
      eventText += ' joined the show';
      break;
    }

    case 'CUSTOMER LEFT': {
      eventText += ' left the show';
      break;
    }

    default: {
      eventText = 'No Events';
    }
  }

  return eventText;
};
