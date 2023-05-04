import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ShowManagerModule } from './show-manager/show-manager.module';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MASTER_DB_ENDPOINT: Joi.string().required(),
        PUBLIC_RXDB_PASSWORD: Joi.string().required(),
        JWT_MASTER_DB_SECRET: Joi.string().required(),
        JWT_MASTER_DB_USER: Joi.string().required(),
        JWT_EXPIRY: Joi.number().required(),
      }),
    }),
    ShowManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
