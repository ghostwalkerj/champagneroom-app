import { Module } from '@nestjs/common';
import { PsharedService } from './pshared.service';

@Module({
  providers: [PsharedService],
  exports: [PsharedService],
})
export class PsharedModule {}
