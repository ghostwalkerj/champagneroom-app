/* eslint-disable @typescript-eslint/naming-convention */

import to from 'await-to-js';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';

import type { AgentDocument } from '$lib/models/agent';
import type { CreatorDocument } from '$lib/models/creator';
import type { RoomDocumentType } from '$lib/models/room';
import type { ShowDocument } from '$lib/models/show';
import type { ShowEventDocument } from '$lib/models/showEvent';
import type { TicketDocument } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';

import Config from '$lib/config';

const enum EntityType {
  AGENT = 'Agent',
  CREATOR = 'Creator',
  SHOW = 'Show',
  SHOWEVENT = 'ShowEvent',
  TICKET = 'Ticket',
  WALLET = 'Wallet',
  USER = 'User',
  ROOM = 'Room'
}

const abstractUpdateStore = <T extends { _id?: any }>({
  doc,
  type
}: {
  doc: T;
  type: EntityType;
}) => {
  const { subscribe, set } = writable<T>(doc, () => {
    if (!doc._id) {
      throw new Error('Doc must have an _id');
    }
    let baseDocument = doc;
    const callback = (document: Partial<T>) => {
      baseDocument = {
        ...baseDocument,
        ...document
      };
      set(baseDocument);
    };

    const abortDocument = getUpdateNotification({
      id: doc._id.toString(),
      callback,
      type
    });

    return () => {
      abortDocument?.abort();
    };
  });
  return {
    subscribe
  };
};

export const AgentStore = (agent: AgentDocument) => {
  return abstractUpdateStore<AgentDocument>({
    doc: agent,
    type: EntityType.AGENT
  });
};

export const CreatorStore = (creator: CreatorDocument) => {
  return abstractUpdateStore<CreatorDocument>({
    doc: creator,
    type: EntityType.CREATOR
  });
};

const getUpdateNotification = <T>({
  id,
  callback,
  type
}: {
  id: string;
  callback: (changeset: Partial<T>) => void;
  type: EntityType;
}) => {
  const path = urlJoin(Config.PATH.notifyUpdate, id, '?type=' + type);
  const abortDocument = new AbortController();
  const waitFor = async () => {
    let shouldLoop = true;
    while (shouldLoop) {
      const signal = abortDocument.signal;
      const [error, response] = await to(
        fetch(path, {
          signal
        })
      );
      if (error) {
        shouldLoop = false;
        console.error(error);
      } else {
        try {
          const jsonResponse = await response.json();
          callback(jsonResponse);
        } catch (error) {
          console.error(error);
          shouldLoop = false;
        }
      }
    }
  };
  waitFor();
  return abortDocument;
};

const getInsertNotification = <T>({
  id,
  callback,
  type,
  relatedField
}: {
  id: string;
  callback: (changeset: T) => void;
  type: EntityType;
  relatedField?: string;
}) => {
  const typeQuery = '?type=' + type;
  const queryString = relatedField
    ? typeQuery + '&relatedField=' + relatedField
    : typeQuery;
  const path = urlJoin(Config.PATH.notifyInsert, id, queryString);
  const abortDocument = new AbortController();
  const waitFor = async () => {
    let shouldLoop = true;
    while (shouldLoop) {
      const signal = abortDocument.signal;

      const [error, response] = await to(
        fetch(path, {
          signal
        })
      );
      if (error) {
        console.error(error);
        shouldLoop = false;
      } else {
        try {
          const jsonResponse = await response.json();
          callback(jsonResponse);
        } catch (error) {
          console.error(error);
          shouldLoop = false;
        }
      }
    }
  };
  waitFor();
  return abortDocument;
};

export const RoomStore = (room: RoomDocumentType) => {
  return abstractUpdateStore<RoomDocumentType>({
    doc: room,
    type: EntityType.ROOM
  });
};

export const ShowEventStore = (show: ShowDocument) => {
  const showStore = writable<ShowDocument>(show);
  const showEventStore = derived<typeof showStore, ShowEventDocument>(
    showStore,
    ($show, set) => {
      let abortShowEvent = new AbortController();
      const callback = set;

      abortShowEvent = getInsertNotification<ShowEventDocument>({
        id: $show._id.toString(),
        callback,
        type: EntityType.SHOWEVENT,
        relatedField: EntityType.SHOW.toLowerCase()
      });

      return () => {
        abortShowEvent.abort();
      };
    }
  );
  return {
    set: showStore.set,
    subscribe: showEventStore.subscribe
  };
};

export const ShowStore = (show: ShowDocument) => {
  return abstractUpdateStore<ShowDocument>({
    doc: show,
    type: EntityType.SHOW
  });
};

export const TicketStore = (ticket: TicketDocument) => {
  return abstractUpdateStore<TicketDocument>({
    doc: ticket,
    type: EntityType.TICKET
  });
};

export const UserStore = (user: UserDocument) => {
  return abstractUpdateStore<UserDocument>({
    doc: user,
    type: EntityType.USER
  });
};

export const WalletStore = (wallet: WalletDocument) => {
  return abstractUpdateStore<WalletDocument>({
    doc: wallet,
    type: EntityType.WALLET
  });
};
