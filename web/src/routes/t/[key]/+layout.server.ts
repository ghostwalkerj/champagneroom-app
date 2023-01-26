import type { ShowDocument } from '$lib/ORM/models/show';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import jwt from 'jsonwebtoken';
import {
  JWT_EXPIRY,
  JWT_MASTER_DB_SECRET,
  JWT_MASTER_DB_USER,
  JWT_TALENT_DB_SECRET,
  JWT_TALENT_DB_USER,
  PRIVATE_MASTER_DB_ENDPOINT,
} from '$env/static/private';
import { talentDB } from '$lib/ORM/dbs/talentDB';
import { StorageType } from '$lib/ORM/rxdb';

const getTalent = async (key: string) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + Number.parseInt(JWT_EXPIRY),
      sub: JWT_MASTER_DB_USER,
    },
    JWT_MASTER_DB_SECRET,
    { keyid: JWT_MASTER_DB_USER }
  );

  const db = await talentDB(key, token, {
    endPoint: PRIVATE_MASTER_DB_ENDPOINT,
    storageType: StorageType.NODE_WEBSQL,
  });
  if (!db) {
    throw error(500, 'no db');
  }
  const talent = await db.talents.findOne().where('key').eq(key).exec();
  if (!talent) {
    throw error(404, 'Talent not found');
  }
  return talent;
};

export const load: PageServerLoad = async ({ params }) => {
  const key = params.key;

  if (key === null) {
    throw error(404, 'Key not found');
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + +JWT_EXPIRY,
      sub: JWT_TALENT_DB_USER,
    },
    JWT_TALENT_DB_SECRET,
    { keyid: JWT_TALENT_DB_USER }
  );

  const _talent = await getTalent(key);

  await _talent.updateStats();
  const _currentShow = (await _talent.populate('currentShow')) as ShowDocument;
  const _completedShows = (await _talent.populate(
    'stats.completedShows'
  )) as ShowDocument[];
  const talent = _talent.toJSON();
  const currentShow = _currentShow ? _currentShow.toJSON() : undefined;
  const completedShows = _completedShows.map(link => link.toJSON());

  return {
    token,
    talent,
    currentShow,
    completedShows,
  };
};
