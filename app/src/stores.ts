/* eslint-disable @typescript-eslint/naming-convention */

import to from 'await-to-js';
import type { Types } from 'mongoose';
import { derived, get, writable } from 'svelte/store';
import urlJoin from 'url-join';

import { invalidateAll } from '$app/navigation';
import { page } from '$app/stores';

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
    const abortDocument = new AbortController();
    const signal = abortDocument.signal;
    const callback = () => {
      invalidateAll().then(() => {
        const updatedDocument = get(page).data[type.toLocaleLowerCase()] as T;
        set(updatedDocument);
      });
    };

    getUpdateNotification({
      id: doc._id.toString(),
      callback,
      signal,
      type
    });

    return () => {
      abortDocument.abort();
    };
  });
  return {
    subscribe
  };
};

export const agentStore = (agent: AgentDocumentType) => {
  return abstractUpdateStore<AgentDocumentType>({
    doc: agent,
    type: EntityType.AGENT
  });
};

export const creatorStore = (creator: CreatorDocumentType) => {
  return abstractUpdateStore<CreatorDocumentType>({
    doc: creator,
    type: EntityType.CREATOR
  });
};

const getUpdateNotification = ({
  id,
  callback,
  signal,
  type
}: {
  id: string;
  callback: () => void;
  signal?: AbortSignal;
  type: EntityType;
}) => {
  const path = urlJoin(Config.Path.notifyUpdate, id, '?type=' + type);
  const waitFor = async () => {
    let shouldLoop = true;
    while (shouldLoop) {
      const [error] = await to(
        fetch(path, {
          signal
        })
      );
      if (error) {
        shouldLoop = false;
      } else {
        try {
          callback();
        } catch (error) {
          console.error(error);
          shouldLoop = false;
        }
      }
    }
  };
  waitFor();
};

const getInsertNotification = <T>({
  id,
  callback,
  signal,
  type,
  relatedField
}: {
  id: string;
  callback: (changeset: T) => void;
  signal?: AbortSignal;
  type: EntityType;
  relatedField?: string;
}) => {
  const typeQuery = '?type=' + type;
  const queryString = relatedField
    ? typeQuery + '&relatedField=' + relatedField
    : typeQuery;
  const path = urlJoin(Config.Path.notifyInsert, id, queryString);
  const waitFor = async () => {
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
  waitFor();
};

export const showEventStore = (show: ShowDocumentType) => {
  const showStore = writable<ShowDocumentType>(show);
  const showEventStore = derived<typeof showStore, ShowEventDocumentType>(
    showStore,
    ($show, set) => {
      const abortShowEvent = new AbortController();
      const showEventSignal = abortShowEvent.signal;
      const callback = set;

      getInsertNotification<ShowEventDocumentType>({
        id: $show._id.toString(),
        callback,
        signal: showEventSignal,
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

export const showStore = (show: ShowDocumentType) => {
  return abstractUpdateStore<ShowDocumentType>({
    doc: show,
    type: EntityType.SHOW
  });
};

export const ticketStore = (ticket: TicketDocumentType) => {
  return abstractUpdateStore<TicketDocumentType>({
    doc: ticket,
    type: EntityType.TICKET
  });
};

export const userStore = (user: UserDocumentType) => {
  return abstractUpdateStore<UserDocumentType>({
    doc: user,
    type: EntityType.USER
  });
};

export const walletStore = (wallet: WalletDocumentType) => {
  return abstractUpdateStore<WalletDocumentType>({
    doc: wallet,
    type: EntityType.WALLET
  });
};
