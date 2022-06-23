import type { RequestEvent, RequestHandler, ResponseBody } from '@sveltejs/kit';
import { getDb, LinkDocument, type LinkType } from 'db';
type GetParams = Record<string, string>;

export const get: RequestHandler<GetParams, ResponseBody> = async (
  event: RequestEvent<GetParams>
) => {
  try {
    const address = event.params.id;
    const db = getDb();
    let linkDocument: LinkType = {};

    await db.createIndex({
      index: {
        fields: ['address', 'expired']
      }
    });

    const currentLink = (await db.find({
      selector: { address, expired: false },
      limit: 1
    })) as PouchDB.Find.FindResponse<LinkDocument>;

    if (currentLink.docs.length === 1) {
      linkDocument = currentLink.docs[0];
    }

    return {
      status: 200,
      body: {
        success: true,
        linkDocument
      }
    };
  } catch (error) {
    return {
      status: 200,
      body: {
        success: false,
        error: error.message,
        linkDocument: null
      }
    };
  }
};
