import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';
import { CreateGroupProfileDto } from '../dtos/group-profile.dto.js';
import { UpdateOpenPositionDto } from '../dtos/create-open-position.dto.js';

@Controller('api/v1/users/me/groups')
@UseGuards(AccessTokenGuard)
export class UserGroupsController {
  private readonly groups = new GroupPrismaRepository();
  private readonly positions = new OpenPositionPrismaRepository();

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateGroupProfileDto) {
    const group = await this.groups.createForUser(request.user.userId, dto);
    return this.response(group);
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.response(await this.groups.findByUserId(request.user.userId));
  }

  @Get(':groupId/positions')
  async listPositions(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string) {
    if (!(await this.groups.belongsToUser(groupId, request.user.userId))) {
      throw new NotFoundException(`Groupe ${groupId} introuvable.`);
    }
    return this.response(await this.positions.findByGroupForUser(groupId, request.user.userId));
  }

  @Patch(':groupId/positions/:positionId')
  async updatePosition(
    @Req() request: AuthenticatedRequest,
    @Param('groupId') groupId: string,
    @Param('positionId') positionId: string,
    @Body() dto: UpdateOpenPositionDto,
  ) {
    if (dto.instrument === undefined && dto.niveau === undefined) {
      throw new BadRequestException('Au moins un champ du poste doit être fourni.');
    }

    const position = await this.positions.updateForGroupUser(groupId, positionId, request.user.userId, {
      ...(dto.instrument !== undefined ? { instrumentRecherche: dto.instrument } : {}),
      ...(dto.niveau !== undefined
        ? { niveauAttendu: dto.niveau as 'debutant' | 'intermediaire' | 'avance' | 'expert' }
        : {}),
    });
    if (!position) throw new NotFoundException(`Poste ${positionId} introuvable.`);
    return this.response(position);
  }

  @Delete(':groupId/positions/:positionId')
  async deletePosition(
    @Req() request: AuthenticatedRequest,
    @Param('groupId') groupId: string,
    @Param('positionId') positionId: string,
  ) {
    const deleted = await this.positions.deleteForGroupUser(groupId, positionId, request.user.userId);
    if (!deleted) throw new NotFoundException(`Poste ${positionId} introuvable.`);
    return this.response({ success: true });
  }

  private response<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}
