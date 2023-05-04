import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerDBType, serverDB } from 'pShared/src/ORM/dbs/serverDB';
import jwt from 'jsonwebtoken';
import { StorageType } from 'pShared/src/ORM/rxdb';

@Injectable()
export class ShowManagerService {
  public db: ServerDBType;
  constructor(private configService: ConfigService) {}

  async init() {
    const MASTER_DB_ENDPOINT =
      this.configService.get<string>('MASTER_DB_ENDPOINT');

    const JWT_MASTER_DB_SECRET = this.configService.get<string>(
      'JWT_MASTER_DB_SECRET',
    );

    const JWT_MASTER_DB_USER =
      this.configService.get<string>('JWT_MASTER_DB_USER');

    const PUBLIC_RXDB_PASSWORD = this.configService.get<string>(
      'PUBLIC_RXDB_PASSWORD',
    );

    const JWT_EXPIRY = this.configService.get<number>('JWT_EXPIRY');

    if (
      !MASTER_DB_ENDPOINT ||
      !JWT_MASTER_DB_SECRET ||
      !JWT_MASTER_DB_USER ||
      !PUBLIC_RXDB_PASSWORD ||
      !JWT_EXPIRY
    ) {
      throw new Error('Missing config');
    }

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
        sub: JWT_MASTER_DB_USER,
      },
      JWT_MASTER_DB_SECRET,
      { keyid: JWT_MASTER_DB_USER },
    );

    const _db = await serverDB(token, {
      endPoint: MASTER_DB_ENDPOINT,
      storageType: StorageType.NODE_WEBSQL,
      rxdbPassword: PUBLIC_RXDB_PASSWORD,
    });
    if (!_db) {
      throw new Error('No db');
    }
    this.db = _db;
  }
}
