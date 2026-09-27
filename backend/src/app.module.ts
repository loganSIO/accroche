import type { StringValue } from 'ms';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusiciansController } from './presentation/controllers/musicians.controller.js';
import { RegisterAccountController } from './presentation/controllers/register-account.controller.js';
import { GroupsController } from './presentation/controllers/groups.controller.js';
import { MapController } from './presentation/controllers/map.controller.js';
import { PositionsController } from './presentation/controllers/positions.controller.js';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { UsersController } from './presentation/controllers/users.controller.js';
import { AccessTokenGuard } from './presentation/guards/access-token.guard.js';
import { MusicianProfileController } from './presentation/controllers/musician-profile.controller.js';
import { UserGroupsController } from './presentation/controllers/user-groups.controller.js';
import { PublicProfilesController } from './presentation/controllers/public-profiles.controller.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue },
    }),
  ],
  controllers: [
    AppController,
    MusiciansController,
    GroupsController,
    RegisterAccountController,
    MapController,
    PositionsController,
    AuthController,
    UsersController,
    MusicianProfileController,
    UserGroupsController,
    PublicProfilesController,
  ],
  providers: [AppService, AccessTokenGuard],
})
export class AppModule {}