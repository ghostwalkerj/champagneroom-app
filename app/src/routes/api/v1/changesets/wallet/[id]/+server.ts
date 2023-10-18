import mongoose from 'mongoose';

import { Wallet } from '$lib/models/wallet';

import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  const walletId = params.id;
  const isFirstFetch = url.searchParams.has('isFirstFetch')
    ? url.searchParams.get('isFirstFetch') === 'true'
    : false;

  if (walletId === null) {
    return new Response('Wallet not found', { status: 404 });
  }
  const id = new mongoose.Types.ObjectId(walletId);

  if (isFirstFetch) {
    const wallet = await Wallet.findById(id).exec();
    if (wallet !== undefined) {
      return new Response(JSON.stringify(wallet));
    }
  }
  const pipeline = [
    {
      $match: {
        'fullDocument._id': id
      }
    }
  ];
  const changeStream = Wallet.watch(pipeline, { fullDocument: 'updateLookup' });
  const next = await changeStream.next();
  const document = next.fullDocument;
  changeStream.close();
  return new Response(String(JSON.stringify(document)));
}) satisfies RequestHandler;
