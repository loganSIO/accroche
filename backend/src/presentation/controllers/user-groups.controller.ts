import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';
import { CreateGroupProfileDto } from '../dtos/group-profile.dto.js';

@Controller('api/v1/users/me/groups')
@UseGuards(AccessTokenGuard)
export class UserGroupsController {
  private readonly groups = new GroupPrismaRepository();

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateGroupProfileDto) {
    const group = await this.groups.createForUser(request.user.userId, dto);
    return this.response(group);
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.response(await this.groups.findByUserId(request.user.userId));
  }

  private response<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}
