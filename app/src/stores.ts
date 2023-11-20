/* eslint-disable @typescript-eslint/naming-convention */

import to from 'await-to-js';
import type { Types } from 'mongoose';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';

import type { AgentDocumentType } from '$lib/models/agent';
import type { CreatorDocumentType } from '$lib/models/creator';
import type { ShowDocumentType } from '$lib/models/show';
import type { ShowEventDocumentType } from '$lib/models/showEvent';
import type { TicketDocumentType } from '$lib/models/ticket';
import type { UserDocumentType } from '$lib/models/user';
import type { WalletDocumentType } from '$lib/models/wallet';

import Config from '$lib/config';

const enum EntityType {
  AGENT = 'Agent',
  CREATOR = 'Creator',
  SHOW = 'Show',
  SHOWEVENT = 'ShowEvent',
  TICKET = 'Ticket',
  WALLET = 'Wallet',
  USER = 'User'
}

const abstractUpdateStore = <T extends { _id: Types.ObjectId }>({
  doc,
  type
}: {
  doc: T;
  type: EntityType;
}) => {
  const { subscribe, set } = writable<T>(doc, () => {
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

export const AgentStore = (agent: AgentDocumentType) => {
  return abstractUpdateStore<AgentDocumentType>({
    doc: agent,
    type: EntityType.AGENT
  });
};

export const CreatorStore = (creator: CreatorDocumentType) => {
  return abstractUpdateStore<CreatorDocumentType>({
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
  const path = urlJoin(Config.Path.notifyUpdate, id, '?type=' + type);
  let abortDocument = new AbortController();
  const waitFor = async (_abortDocument: AbortController | undefined) => {
    let shouldLoop = true;
    while (shouldLoop) {
      if (_abortDocument) _abortDocument.abort();
      _abortDocument = new AbortController();
      abortDocument = _abortDocument;
      const signal = _abortDocument.signal;

      const [error, response] = await to(
        fetch(path, {
          signal
        })
      );
      if (error) {
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
  waitFor(abortDocument);
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
  const path = urlJoin(Config.Path.notifyInsert, id, queryString);
  let abortDocument = new AbortController();
  const waitFor = async (_abortDocument: AbortController | undefined) => {
    if (_abortDocument) _abortDocument.abort();
    _abortDocument = new AbortController();
    abortDocument = _abortDocument;
    const signal = _abortDocument.signal;
    let shouldLoop = true;
    while (shouldLoop) {
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
  waitFor(abortDocument);
  return abortDocument;
};

export const ShowEventStore = (show: ShowDocumentType) => {
  const showStore = writable<ShowDocumentType>(show);
  const showEventStore = derived<typeof showStore, ShowEventDocumentType>(
    showStore,
    ($show, set) => {
      let abortShowEvent = new AbortController();
      const callback = set;

      abortShowEvent = getInsertNotification<ShowEventDocumentType>({
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

export const ShowStore = (show: ShowDocumentType) => {
  return abstractUpdateStore<ShowDocumentType>({
    doc: show,
    type: EntityType.SHOW
  });
};

export const TicketStore = (ticket: TicketDocumentType) => {
  return abstractUpdateStore<TicketDocumentType>({
    doc: ticket,
    type: EntityType.TICKET
  });
};

export const UserStore = (user: UserDocumentType) => {
  return abstractUpdateStore<UserDocumentType>({
    doc: user,
    type: EntityType.USER
  });
};

export const WalletStore = (wallet: WalletDocumentType) => {
  return abstractUpdateStore<WalletDocumentType>({
    doc: wallet,
    type: EntityType.WALLET
  });
};
