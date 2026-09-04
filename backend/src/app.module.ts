import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusiciansController } from './presentation/controllers/musicians.controller.js';
import { RegisterAccountController } from './presentation/controllers/register-account.controller.js';
import { GroupsController } from './presentation/controllers/groups.controller.js';
import { MapController } from './presentation/controllers/map.controller.js';

@Module({
  imports: [],
  controllers: [AppController, MusiciansController, GroupsController, RegisterAccountController, MapController],
  providers: [AppService],
})
export class AppModule {}