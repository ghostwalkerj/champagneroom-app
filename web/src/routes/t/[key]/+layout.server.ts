import { masterDB } from '$lib/ORM/dbs/masterDB';
import type { ShowDocument } from '$lib/ORM/models/show';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import jwt from 'jsonwebtoken';
import {
  JWT_EXPIRY,
  JWT_TALENT_DB_SECRET,
  JWT_TALENT_DB_USER,
} from '$env/static/private';

const getTalent = async (key: string) => {
  const db = await masterDB();
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
