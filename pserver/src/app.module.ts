import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ShowManagerModule } from './show-manager/show-manager.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ShowManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
