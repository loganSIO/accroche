import { prisma } from '../prisma.client.js';

export class MatchNotFoundError extends Error {}
export class ContactAlreadyExistsError extends Error {}
export class ConversationAccessError extends Error {}

export class MessagingPrismaRepository {
  async createContactForProfile(profileType: 'musician' | 'group', profileId: string, userId: string) {
    const musician = await prisma.musicianProfile.findUnique({ where: { userId }, select: { id: true } });
    const group = await prisma.groupProfile.findFirst({ where: { userId }, select: { id: true } });
    const target = profileType === 'group'
      ? await prisma.groupProfile.findUnique({ where: { id: profileId }, select: { userId: true } })
      : await prisma.musicianProfile.findUnique({ where: { id: profileId }, select: { userId: true } });
    if (!target) throw new MatchNotFoundError('Profil introuvable.');

    const participantIds = profileType === 'group'
      ? musician && [userId, target.userId]
      : (musician || group) && [userId, target.userId];
    if (!participantIds || target.userId === userId) {
      throw new ConversationAccessError('Ce profil ne peut pas être contacté.');
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          groupProfileId: profileType === 'group' ? profileId : null,
          members: { every: { userId: { in: participantIds } } },
          AND: participantIds.map((participantId) => ({ members: { some: { userId: participantId } } })),
        },
      });
      if (existing) {
        await tx.conversationMember.updateMany({
          where: { conversationId: existing.id, userId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
      }
      const conversation = existing ?? await tx.conversation.create({
        data: {
          ...(profileType === 'group' ? { groupProfileId: profileId } : {}),
          members: { create: participantIds.map((id) => ({ userId: id })) },
        },
      });
      return { conversation };
    });
  }

  async createContact(matchId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          musician: { select: { userId: true } },
          position: { select: { groupProfile: { select: { id: true, userId: true } }, foundingProfile: { select: { founderMusician: { select: { userId: true } } } } } },
          contact: true,
        },
      });
      if (!match) throw new MatchNotFoundError(`Match ${matchId} introuvable.`);

      const participantIds = [match.musician.userId];
      const ownerId = match.position.groupProfile?.userId ?? match.position.foundingProfile?.founderMusician.userId;
      if (!ownerId || ![...participantIds, ownerId].includes(userId)) {
        throw new ConversationAccessError('Vous ne pouvez pas contacter ce match.');
      }
      if (match.contact) throw new ContactAlreadyExistsError('Ce match a déjà fait l’objet d’un contact.');
      if (!participantIds.includes(ownerId)) participantIds.push(ownerId);

      const conversation = await tx.conversation.create({
        data: {
          ...(match.position.groupProfile ? { groupProfileId: match.position.groupProfile.id } : {}),
          members: { create: participantIds.map((id) => ({ userId: id })) },
        },
      });
      const contact = await tx.contact.create({
        data: {
          matchId,
          musicianId: match.musicianId,
          initiatedBy: userId === match.musician.userId ? 'MUSICIAN' : 'GROUP',
          conversationId: conversation.id,
        },
      });
      await tx.match.update({ where: { id: matchId }, data: { statut: 'CONTACTE' } });
      return { contact, conversation };
    });
  }

  async findContactsByUserId(userId: string) {
    return prisma.contact.findMany({
      where: { OR: [{ musician: { userId } }, { match: { position: { groupProfile: { userId } } } }, { match: { position: { foundingProfile: { founderMusician: { userId } } } } }] },
      include: {
        conversation: { include: { groupProfile: { select: { id: true, name: true } }, members: { include: { user: { select: { id: true, email: true, musicianProfile: { select: { id: true, musicianName: true } }, groupProfiles: { select: { id: true, name: true }, take: 1 } } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        musician: { select: { id: true, musicianName: true } },
        match: { select: { id: true, positionId: true, scoreGlobal: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findConversationsByUserId(userId: string) {
    return prisma.conversation.findMany({
      where: { members: { some: { userId, deletedAt: null } } },
      include: {
        groupProfile: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, email: true, musicianProfile: { select: { id: true, musicianName: true } }, groupProfiles: { select: { id: true, name: true }, take: 1 } } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findConversationForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, members: { some: { userId, deletedAt: null } } },
      include: { groupProfile: { select: { id: true, name: true } }, members: { include: { user: { select: { id: true, email: true, musicianProfile: { select: { id: true, musicianName: true } }, groupProfiles: { select: { id: true, name: true }, take: 1 } } } } } },
    });
  }

  async deleteConversationForUser(conversationId: string, userId: string): Promise<boolean> {
    const result = await prisma.conversationMember.updateMany({
      where: { conversationId, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count === 1;
  }

  async findMessages(conversationId: string, userId: string) {
    const conversation = await this.findConversationForUser(conversationId, userId);
    if (!conversation) throw new ConversationAccessError('Conversation introuvable.');
    const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return messages;
  }

  async createMessage(conversationId: string, userId: string, content: string) {
    const conversation = await this.findConversationForUser(conversationId, userId);
    if (!conversation) throw new ConversationAccessError('Conversation introuvable.');
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { conversationId, senderId: userId, content } });
      await tx.conversationMember.updateMany({
        where: { conversationId, userId: { not: userId } },
        data: { deletedAt: null },
      });
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: message.createdAt },
      });
      return message;
    });
  }
}
