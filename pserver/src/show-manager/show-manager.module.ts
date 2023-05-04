import { Module } from '@nestjs/common';
import { ShowManagerService } from './show-manager.service';

@Module({
  providers: [ShowManagerService],
})
export class ShowManagerModule {}
