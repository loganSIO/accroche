import { Body, ConflictException, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MessagingPrismaRepository, ContactAlreadyExistsError, ConversationAccessError, MatchNotFoundError } from '../../infrastructure/repositories/messaging-prisma.repository.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';
import { CreateMessageDto } from '../dtos/create-message.dto.js';

@Controller('api/v1')
@UseGuards(AccessTokenGuard)
export class MessagingController {
  private readonly messaging = new MessagingPrismaRepository();

  @Post('matches/:matchId/contact')
  async contact(@Req() request: AuthenticatedRequest, @Param('matchId') matchId: string) {
    try {
      const result = await this.messaging.createContact(matchId, request.user.userId);
      return this.envelope({ ...result.contact, conversationId: result.conversation.id });
    } catch (error) {
      if (error instanceof MatchNotFoundError) throw new NotFoundException(error.message);
      if (error instanceof ContactAlreadyExistsError) throw new ConflictException(error.message);
      if (error instanceof ConversationAccessError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  @Post('profiles/:type/:profileId/contact')
  async contactProfile(
    @Req() request: AuthenticatedRequest,
    @Param('type') type: 'musician' | 'group',
    @Param('profileId') profileId: string,
  ) {
    if (type !== 'musician' && type !== 'group') throw new NotFoundException('Type de profil invalide.');
    try {
      const result = await this.messaging.createContactForProfile(type, profileId, request.user.userId);
      return this.envelope({ conversationId: result.conversation.id });
    } catch (error) {
      if (error instanceof MatchNotFoundError) throw new NotFoundException(error.message);
      if (error instanceof ConversationAccessError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  @Get('users/me/contacts')
  async contacts(@Req() request: AuthenticatedRequest) {
    return this.envelope(await this.messaging.findContactsByUserId(request.user.userId));
  }

  @Get('conversations')
  async conversations(@Req() request: AuthenticatedRequest) {
    return this.envelope(await this.messaging.findConversationsByUserId(request.user.userId));
  }

  @Get('conversations/:id/messages')
  async messages(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    try {
      return this.envelope(await this.messaging.findMessages(id, request.user.userId));
    } catch (error) {
      if (error instanceof ConversationAccessError) throw new ForbiddenException(error.message);
      throw error;
    }

  }

  @Delete('conversations/:id')
  async deleteConversation(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const deleted = await this.messaging.deleteConversationForUser(id, request.user.userId);
    if (!deleted) throw new NotFoundException('Conversation introuvable.');
    return this.envelope({ success: true });
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateMessageDto) {
    try {
      return this.envelope(await this.messaging.createMessage(id, request.user.userId, dto.content.trim()));
    } catch (error) {
      if (error instanceof ConversationAccessError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  private envelope<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}
