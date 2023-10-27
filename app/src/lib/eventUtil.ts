import * as timeago from 'timeago.js';

import type { ShowEventDocumentType } from '$lib/models/showEvent';

export const createEventText = (showEvent: ShowEventDocumentType) => {
  let eventText =
    timeago.format(showEvent.createdAt) +
      ' ' +
      showEvent.ticketInfo?.customerName ?? 'someone';

  switch (showEvent.type) {
    case 'TICKET SOLD': {
      eventText += ' paid in full!';
      break;
    }

    case 'TICKET RESERVED': {
      eventText += ' reserved a ticket!';
      break;
    }

    case 'TICKET CANCELLED': {
      eventText += ' cancelled';
      break;
    }

    default: {
      eventText = 'No Events';
    }
  }

  return eventText;
};