import * as timeago from 'timeago.js';

import type { ShowEventDocumentType } from '$lib/models/showEvent';

import { ShowJobDataType } from '$lib/constants';

export const createEventText = (
  showEvent: ShowEventDocumentType | undefined
) => {
  const name = showEvent?.ticketInfo?.customerName || 'someone';
  if (showEvent === undefined) {
    return 'No Events';
  }
  let eventText = timeago.format(showEvent.createdAt) + ' ' + name;

  switch (showEvent.type) {
    case ShowJobDataType.TICKET_SOLD: {
      eventText += ' paid in full!';
      break;
    }

    case ShowJobDataType.TICKET_RESERVED: {
      eventText += ' reserved a ticket!';
      break;
    }

    case ShowJobDataType.TICKET_CANCELLED: {
      eventText += ' cancelled the ticket';
      break;
    }

    case ShowJobDataType.TICKET_REFUNDED: {
      eventText += ' refunded';
      break;
    }

    case ShowJobDataType.TICKET_DISPUTED: {
      eventText += ' disputed the ticket';
      break;
    }

    case ShowJobDataType.CUSTOMER_JOINED: {
      eventText += ' joined the show';
      break;
    }

    case ShowJobDataType.CUSTOMER_LEFT: {
      eventText += ' left the show';
      break;
    }

    default: {
      eventText = 'No Events';
    }
  }

  return eventText;
};
