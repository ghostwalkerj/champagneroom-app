import to from 'await-to-js';
import urlJoin from 'url-join';

import {
  PUBLIC_NOTIFY_INSERT_PATH,
  PUBLIC_NOTIFY_UPDATE_PATH
} from '$env/static/public';

export const notifyInsert = ({
  type,
  id,
  callback,
  relatedType
}: {
  type: string;
  id: string;
  callback: () => void;
  relatedType?: string;
}) => {
  const abortDocument = new AbortController();
  const signal = abortDocument.signal;
  const typeQuery = '?type=' + type;
  const queryString = relatedType
    ? typeQuery + '&relatedType=' + relatedType
    : typeQuery;
  const path = urlJoin(PUBLIC_NOTIFY_INSERT_PATH, id, queryString);
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
  return () => {
    abortDocument.abort();
  };
};

export const notifyUpdate = ({
  type,
  id,
  callback
}: {
  type: string;
  id: string;
  callback: () => void;
}) => {
  const abortDocument = new AbortController();
  const signal = abortDocument.signal;
  const path = urlJoin(PUBLIC_NOTIFY_UPDATE_PATH, id, '?type=' + type);
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
  return () => {
    abortDocument.abort();
  };
};
