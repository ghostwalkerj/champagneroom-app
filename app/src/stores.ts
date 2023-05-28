import { PUBLIC_CHANGESET_PATH } from '$env/static/public';
import to from 'await-to-js';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';
import type { AgentDocType } from './lib/models/agent';
import type { ShowDocType } from './lib/models/show';
import type { ShowEventDocType } from './lib/models/showEvent';
import type { TalentDocType } from './lib/models/talent';
import type { TicketDocType } from './lib/models/ticket';

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
  cancelOn?: (doc: T) => boolean;
}) => {
  let loop = true;
  let firstFetch = true;
  while (loop) {
    const path = firstFetch
      ? urlJoin(changesetPath, '?firstFetch=true')
      : changesetPath;
    firstFetch = false;

    const [err, response] = await to(
      fetch(path, {
        signal,
      })
    );
    if (err) {
      loop = false;
    } else {
      try {
        const jsonResponse = await response.json();
        callback(jsonResponse);
        if (cancelOn) {
          loop = !cancelOn(jsonResponse);
        }
      } catch (e) {
        console.error(e);
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
  cancelOn?: (doc: T) => boolean;
}) => {
  const { subscribe, set } = writable<T>(doc, () => {
    if (cancelOn && cancelOn(doc)) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
    const abortDoc = new AbortController();
    const signal = abortDoc.signal;
    getChangeset<T>({ changesetPath, callback: set, signal, cancelOn });
    return () => {
      abortDoc.abort();
    };
  });
  return {
    subscribe,
  };
};

export const talentStore = (talent: TalentDocType) => {
  return abstractStore({
    doc: talent,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'talent', talent.key),
  });
};

export const showStore = (show: ShowDocType) => {
  const showCancel = (show: ShowDocType) => !show.showState.active;

  return abstractStore({
    doc: show,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString()),
    cancelOn: showCancel,
  });
};

export const showEventStore = (show: ShowDocType) => {
  const showCancel = (show: ShowDocType) => !show.showState.active;
  const _showStore = writable<ShowDocType>(show);
  const _showEventStore = derived<typeof _showStore, ShowEventDocType>(
    _showStore,
    ($show, set) => {
      if (!showCancel($show)) {
        const abortShowEvent = new AbortController();
        const showEventSignal = abortShowEvent.signal;
        getChangeset<ShowEventDocType>({
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

export const ticketStore = (ticket: TicketDocType) => {
  const ticketCancel = (ticket: TicketDocType) => !ticket.ticketState.active;
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

export const agentStore = (agent: AgentDocType) => {
  return abstractStore({
    doc: agent,
    changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'agent', agent.address),
  });
};
