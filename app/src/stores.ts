import to from 'await-to-js';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';

import type { AgentDocumentType } from '$lib/models/agent';
import type { ShowDocumentType } from '$lib/models/show';
import type { ShowEventDocumentType } from '$lib/models/showEvent';
import type { TalentDocumentType } from '$lib/models/talent';
import type { TicketDocumentType } from '$lib/models/ticket';

import { PUBLIC_CHANGESET_PATH } from '$env/static/public';

export const browserType = writable();

const getChangeset = async <T>({
  changesetPath,
  callback,
  signal,
  cancelOn,
}: {
  changesetPath: string;
  callback: (changeset: T) => void;
  signal?: AbortSignal;
  cancelOn?: (document: T) => boolean;
}) => {
  let loop = true;
  let firstFetch = true;
  while (loop) {
    const path = firstFetch
      ? urlJoin(changesetPath, '?firstFetch=true')
      : changesetPath;
    firstFetch = false;

    const [error, response] = await to(
      fetch(path, {
        signal,
      })
    );
    if (error) {
      loop = false;
    } else {
      try {
        const jsonResponse = await response.json();
        callback(jsonResponse);
        if (cancelOn) {
          loop = !cancelOn(jsonResponse);
        }
      } catch (error) {
        console.error(error);
        loop = false;
      }
    }
  }
};

const abstractStore = <T>({
  doc,
  changesetPath,
  cancelOn,
}: {
  doc: T;
  changesetPath: string;
  cancelOn?: (document: T) => boolean;
}) => {
  const { subscribe, set } = writable<T>(doc, () => {
    if (cancelOn && cancelOn(doc)) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
    const abortDocument = new AbortController();
    const signal = abortDocument.signal;
    getChangeset<T>({ changesetPath, callback: set, signal, cancelOn });
    return () => {
      abortDocument.abort();
    };
  });
  return {
    subscribe,
  };
};

export const talentStore = (talent: TalentDocumentType) => {
  return abstractStore({
    doc: talent,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'talent', talent.key),
  });
};

export const showStore = (show: ShowDocumentType) => {
  const showCancel = (show: ShowDocumentType) => !show.showState.activeState;

  return abstractStore({
    doc: show,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString()),
    cancelOn: showCancel,
  });
};

export const showEventStore = (show: ShowDocumentType) => {
  const showCancel = (show: ShowDocumentType) => !show.showState.activeState;
  const _showStore = writable<ShowDocumentType>(show);
  const _showEventStore = derived<typeof _showStore, ShowEventDocumentType>(
    _showStore,
    ($show, set) => {
      if (!showCancel($show)) {
        const abortShowEvent = new AbortController();
        const showEventSignal = abortShowEvent.signal;
        getChangeset<ShowEventDocumentType>({
          changesetPath: urlJoin(
            PUBLIC_CHANGESET_PATH,
            'showEvent',
            $show._id.toString()
          ),
          callback: set,
          signal: showEventSignal,
        });
        return () => {
          abortShowEvent.abort();
        };
      }
    }
  );
  return {
    set: _showStore.set,
    subscribe: _showEventStore.subscribe,
  };
};

export const ticketStore = (ticket: TicketDocumentType) => {
  const ticketCancel = (ticket: TicketDocumentType) =>
    !ticket.ticketState.activeState;
  return abstractStore({
    doc: ticket,
    changesetPath: urlJoin(
      PUBLIC_CHANGESET_PATH,
      'ticket',
      ticket._id.toString()
    ),
    cancelOn: ticketCancel,
  });
};

export const agentStore = (agent: AgentDocumentType) => {
  return abstractStore({
    doc: agent,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'agent', agent.address),
  });
};
