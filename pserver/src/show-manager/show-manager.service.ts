import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServerDBType } from 'pShared/dist/ORM/dbs/serverDB';

@Injectable()
export class ShowManagerService {
  private serverDB: ServerDBType;
  constructor(private configService: ConfigService) {
    const MASTER_DB_ENDPOINT =
      this.configService.get<string>('MASTER_DB_ENDPOINT');
  }
}
