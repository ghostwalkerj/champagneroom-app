import type { ShowEventDocType } from '$lib/models/showEvent';

import * as timeago from 'timeago.js';

export const createEventText = (showEvent: ShowEventDocType) => {
  let eventText =
    timeago.format(showEvent.createdAt) + ' ' + showEvent.ticketInfo.name ??
    'someone';

  switch (showEvent.type) {
    case 'TICKET SOLD':
      eventText += ' bought a ticket!';
      break;

    case 'TICKET RESERVED':
      eventText += ' reserved a ticket!';
      break;

    case 'TICKET CANCELLED':
      eventText += ' cancelled';
      break;

    default:
      eventText = 'No Events';
  }

  return eventText;
};
