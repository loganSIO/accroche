import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusiciansController } from './presentation/controllers/musicians.controller.js';
import { CreateMusicianController } from './presentation/controllers/create-musician.controller.js';

@Module({
  imports: [],
  controllers: [AppController, MusiciansController, CreateMusicianController],
  providers: [AppService],
})
export class AppModule {}