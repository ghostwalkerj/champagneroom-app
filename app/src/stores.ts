/* eslint-disable @typescript-eslint/naming-convention */
import to from 'await-to-js';
import dot from 'dot-object';
import * as _ from 'lodash';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';

import type { AgentDocument } from '$lib/models/agent';
import type { CreatorDocument } from '$lib/models/creator';
import type { RoomDocument } from '$lib/models/room';
import type { ShowDocument } from '$lib/models/show';
import type { ShowEventDocument } from '$lib/models/showEvent';
import type { TicketDocument } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';

import config from '$lib/config';

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

/**
 * Returns a store that updates the provided document with incoming notifications.
 *
 * @template T - The type of document being stored.
 * @param {Object} options - The options object.
 * @param {T} options.doc - The document to store.
 * @param {EntityType} options.type - The type of the document.
 * @returns {Object} - An object with a `subscribe` method.
 */
const abstractUpdateStore = <T extends { _id?: any }>({
  doc,
  type
}: {
  doc: T;
  type: EntityType;
}): object => {
  const { subscribe, set } = writable<T>(doc, () => {
    if (!doc._id) {
      throw new Error('Doc must have an _id');
    }
    const callback = (updateDocument: Partial<T>) => {
      dot.object(updateDocument);
      const updatedDocument = _.merge(doc, updateDocument);
      set(updatedDocument);
    };

    const abortDocument = getUpdateNotification({
      id: doc._id.toString(),
      callback,
      type
    });

    return () => {
      try {
        abortDocument.abort('Unsubscribe');
      } catch (error) {
        if (error != 'Unsubscribe') {
          console.error(error);
        }
      }
    };
  });
  return {
    subscribe
  };
};

/**
 * Returns a store that updates the provided agent document with incoming notifications.
 *
 * @param {AgentDocument} agent - The agent document to store.
 * @return {Object} An object with a `subscribe` method.
 */
export const AgentStore = (agent: AgentDocument): object => {
  return abstractUpdateStore<AgentDocument>({
    doc: agent,
    type: EntityType.AGENT
  });
};

/**
 * Returns a store that updates the provided creator document with incoming notifications.
 *
 * @param {CreatorDocument} creator - The creator document to store.
 * @return {Object} An object with a `subscribe` method.
 */
export const CreatorStore = (creator: CreatorDocument): object => {
  return abstractUpdateStore<CreatorDocument>({
    doc: creator,
    type: EntityType.CREATOR
  });
};

/**
 * Returns an AbortController object that listens for updates to a document of type T.
 * When an update is received, the provided callback function is called with a partial changeset of T.
 *
 * @template T - The type of the document to update.
 * @param {Object} options - The options for the update notification.
 * @param {string} options.id - The ID of the document to update.
 * @param {(changeset: Partial<T>) => void} options.callback - The callback function to call when an update is received.
 * @param {EntityType} options.type - The type of the document to update.
 * @return {AbortController} - An AbortController object that can be used to abort the update notification.
 */
const getUpdateNotification = <T>({
  id,
  callback,
  type
}: {
  id: string;
  callback: (changeset: Partial<T>) => void;
  type: EntityType;
}): AbortController => {
  const path = urlJoin(config.PATH.notifyUpdate, id, '?type=' + type);
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

/**
 * Retrieves a notification for inserting an entity and continuously listens for updates.
 *
 * @param {Object} options - The options for retrieving the notification.
 * @param {string} options.id - The ID of the entity.
 * @param {function} options.callback - The callback function to handle the changeset.
 * @param {EntityType} options.type - The type of the entity.
 * @param {string} [options.relatedField] - The related field (optional).
 * @return {AbortController} The AbortController for aborting the request.
 */
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
}): AbortController => {
  const typeQuery = '?type=' + type;
  const queryString = relatedField
    ? typeQuery + '&relatedField=' + relatedField
    : typeQuery;
  const path = urlJoin(config.PATH.notifyInsert, id, queryString);
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

/**
 * A function that creates a RoomStore.
 *
 * @param {RoomDocumentType} room - the room document type
 * @return {ReturnType<typeof abstractUpdateStore>} the abstract update store function return type
 */
export const RoomStore = (
  room: RoomDocument
): ReturnType<typeof abstractUpdateStore> => {
  return abstractUpdateStore<RoomDocument>({
    doc: room,
    type: EntityType.ROOM
  });
};

/**
 * Creates a store for managing show events.
 *
 * @param {ShowDocument} show - The initial show document.
 * @return {Object} An object containing the set function and a subscription to the show event store.
 */
export const ShowEventStore = (show: ShowDocument): object => {
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
        try {
          abortShowEvent.abort('Unsubscribe');
        } catch (error) {
          if (error != 'Unsubscribe') {
            console.error(error);
          }
        }
      };
    }
  );
  return {
    set: showStore.set,
    subscribe: showEventStore.subscribe
  };
};

/**
 * Creates a ShowStore object that encapsulates the logic for updating a ShowDocument.
 *
 * @param {ShowDocument} show - The initial ShowDocument.
 * @return {Object} An object with an update method for updating the ShowDocument.
 */
export const ShowStore = (show: ShowDocument): object => {
  return abstractUpdateStore<ShowDocument>({
    doc: show,
    type: EntityType.SHOW
  });
};

/**
 * A function that creates a TicketStore object that encapsulates the logic for updating a TicketDocument.
 *
 * @param {TicketDocument} ticket - The initial TicketDocument.
 * @return {Object} An object with an update method for updating the TicketDocument.
 */
export const TicketStore = (ticket: TicketDocument): object => {
  return abstractUpdateStore<TicketDocument>({
    doc: ticket,
    type: EntityType.TICKET
  });
};

/**
 * Creates a UserStore object that encapsulates the logic for updating a UserDocument.
 *
 * @param {UserDocument} user - The initial UserDocument.
 * @return {Object} An object with an update method for updating the UserDocument.
 */
export const UserStore = (user: UserDocument): object => {
  return abstractUpdateStore<UserDocument>({
    doc: user,
    type: EntityType.USER
  });
};

/**
 * Creates a WalletStore object that encapsulates the logic for updating a WalletDocument.
 *
 * @param {WalletDocument} wallet - The initial WalletDocument.
 * @return {Object} An object with an update method for updating the WalletDocument.
 */
export const WalletStore = (wallet: WalletDocument): object => {
  return abstractUpdateStore<WalletDocument>({
    doc: wallet,
    type: EntityType.WALLET
  });
};
