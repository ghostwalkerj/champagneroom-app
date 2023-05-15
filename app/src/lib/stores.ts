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

const getChangeset = async (
  changesetPath: string,
  callback: (changeset: any) => void,
  signal?: AbortSignal
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
      const changeset = await response.json();
      callback(changeset);
    }
  }
};

const abstractStore = <T>(doc: T, changesetPath: string) => {
  const { subscribe, set } = writable<T>(doc, () => {
    set(doc);
    const abortDoc = new AbortController();
    const docSignal = abortDoc.signal;
    getChangeset(changesetPath, set, docSignal);
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
  return abstractStore(
    show,
    urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString())
  );
};

export const showEventStore = (show: ShowDocType) => {
  const _showStore = writable<ShowDocType>(show);
  const _showEventStore = derived<typeof _showStore, ShowEventDocType>(
    _showStore,
    ($show, set) => {
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
  );
  return {
    set: _showStore.set,
    subscribe: _showEventStore.subscribe,
  };
};

export const ticketStore = (ticket: TicketDocType) => {
  return abstractStore(
    ticket,
    urlJoin(PUBLIC_CHANGESET_PATH, 'ticket', ticket._id.toString())
  );
};

export const agentStore = (agent: AgentDocType) => {
  return abstractStore(
    agent,
    urlJoin(PUBLIC_CHANGESET_PATH, 'agent', agent.address)
  );
};
