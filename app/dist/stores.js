import { PUBLIC_CHANGESET_PATH } from '$env/static/public';
import to from 'await-to-js';
import { derived, writable } from 'svelte/store';
import urlJoin from 'url-join';
export const browserType = writable();
const getChangeset = async ({ changesetPath, callback, signal, cancelOn, }) => {
    let loop = true;
    let firstFetch = true;
    while (loop) {
        const path = firstFetch
            ? urlJoin(changesetPath, '?firstFetch=true')
            : changesetPath;
        firstFetch = false;
        const [err, response] = await to(fetch(path, {
            signal,
        }));
        if (err) {
            loop = false;
        }
        else {
            try {
                const jsonResponse = await response.json();
                callback(jsonResponse);
                if (cancelOn) {
                    loop = !cancelOn(jsonResponse);
                }
            }
            catch (e) {
                console.error(e);
                loop = false;
            }
        }
    }
};
const abstractStore = ({ doc, changesetPath, cancelOn, }) => {
    const { subscribe, set } = writable(doc, () => {
        if (cancelOn && cancelOn(doc)) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => { };
        }
        const abortDoc = new AbortController();
        const signal = abortDoc.signal;
        getChangeset({ changesetPath, callback: set, signal, cancelOn });
        return () => {
            abortDoc.abort();
        };
    });
    return {
        subscribe,
    };
};
export const talentStore = (talent) => {
    return abstractStore({
        doc: talent,
        changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'talent', talent.key),
    });
};
export const showStore = (show) => {
    const showCancel = (show) => !show.showState.active;
    return abstractStore({
        doc: show,
        changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'show', show._id.toString()),
        cancelOn: showCancel,
    });
};
export const showEventStore = (show) => {
    const showCancel = (show) => !show.showState.active;
    const _showStore = writable(show);
    const _showEventStore = derived(_showStore, ($show, set) => {
        if (!showCancel($show)) {
            const abortShowEvent = new AbortController();
            const showEventSignal = abortShowEvent.signal;
            getChangeset({
                changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'showEvent', $show._id.toString()),
                callback: set,
                signal: showEventSignal,
            });
            return () => {
                abortShowEvent.abort();
            };
        }
    });
    return {
        set: _showStore.set,
        subscribe: _showEventStore.subscribe,
    };
};
export const ticketStore = (ticket) => {
    const ticketCancel = (ticket) => !ticket.ticketState.active;
    return abstractStore({
        doc: ticket,
        changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'ticket', ticket._id.toString()),
        cancelOn: ticketCancel,
    });
};
export const agentStore = (agent) => {
    return abstractStore({
        doc: agent,
        changesetPath: urlJoin(PUBLIC_CHANGESET_PATH, 'agent', agent.address),
    });
};
