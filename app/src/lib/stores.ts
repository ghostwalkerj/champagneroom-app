import { PUBLIC_CHANGESET_PATH } from '$env/static/public';
import to from 'await-to-js';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';
import type { AgentDocType } from './models/agent';
import type { ShowDocType } from './models/show';
import type { ShowEventDocType } from './models/showEvent';
import type { TalentDocType } from './models/talent';
import type { TicketDocType } from './models/ticket';

export const browserType = writable();

const getChangeset = async <T>(
  changesetPath: string,
  callback: (changeset: any) => void,
  signal?: AbortSignal,
  cancelOn?: (doc: T) => boolean
) => {
  let loop = true;
  while (loop) {
    const [err, response] = await to(
      fetch(changesetPath, {
        signal,
      })
    );
    if (err) {
      loop = false;
    } else {
      const changeset = (await response.json()) as T;
      callback(changeset);
      if (cancelOn) {
        loop = !cancelOn(changeset);
      }
    }
  }
};

const abstractStore = <T>(
  doc: T,
  changesetPath: string,
  cancelOn?: (doc: T) => boolean
) => {
  const { subscribe, set } = writable<T>(doc, () => {
    set(doc);
    if (cancelOn && cancelOn(doc)) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
    const abortDoc = new AbortController();
    const docSignal = abortDoc.signal;
    getChangeset(changesetPath, set, docSignal, cancelOn);
    return () => {
      abortDoc.abort();
    };
  });
  return {
    subscribe,
  };
};

export const talentStore = (talent: TalentDocType) => {
  return abstractStore(
    talent,
    urlJoin(PUBLIC_CHANGESET_PATH, 'talent', talent.key)
  );
};

export const showStore = (show: ShowDocType) => {
  const showCancel = (show: ShowDocType) => !show.showState.active;

  return abstractStore(
    show,
    urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString()),
    showCancel
  );
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
        getChangeset(
          urlJoin(PUBLIC_CHANGESET_PATH, 'showEvent', $show._id.toString()),
          set,
          showEventSignal
        );
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
  return abstractStore(
    ticket,
    urlJoin(PUBLIC_CHANGESET_PATH, 'ticket', ticket._id.toString()),
    ticketCancel
  );
};

export const agentStore = (agent: AgentDocType) => {
  return abstractStore(
    agent,
    urlJoin(PUBLIC_CHANGESET_PATH, 'agent', agent.address)
  );
};
