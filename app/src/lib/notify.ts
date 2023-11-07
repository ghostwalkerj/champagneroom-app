import to from 'await-to-js';
import urlJoin from 'url-join';

import Config from './config';

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
  const path = urlJoin(Config.Path.notifyInsert, id, queryString);
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
  return () => {
    abortDocument.abort();
  };
};
