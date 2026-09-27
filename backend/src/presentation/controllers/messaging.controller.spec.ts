import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { MessagingController } from './messaging.controller.js';

async function cleanDatabase() {
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.openPosition.deleteMany();
  await prisma.groupProfile.deleteMany();
  await prisma.musicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('MessagingController', () => {
  const controller = new MessagingController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un contact, une conversation et vérifie les membres', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5, longitude: 7.7, rayonKm: 20, ville: 'Strasbourg' },
    });
    const musicianUser = await prisma.user.create({
      data: { email: 'musician-contact@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const musician = await prisma.musicianProfile.create({
      data: { userId: musicianUser.id, zoneId: zone.id, status: 'AMATEUR', objective: [] },
    });
    const groupUser = await prisma.user.create({
      data: { email: 'group-contact@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: { userId: groupUser.id, zoneId: zone.id, name: 'Groupe', styles: [], status: 'ASSOCIATION' },
    });
    const position = await prisma.openPosition.create({
      data: {
        ownerType: 'GROUP',
        groupProfileId: group.id,
        instrumentRecherche: 'basse',
        niveauAttendu: 'intermediaire',
      },
    });
    const match = await prisma.match.create({
      data: {
        musicianId: musician.id,
        positionId: position.id,
        scoreGlobal: 80,
        scoreInstrument: 100,
        scoreStyle: 60,
        scoreZone: 100,
        scoreDisponibilite: 50,
        scoreNiveau: 80,
      },
    });

    const result = await controller.contact({ user: { userId: musicianUser.id } } as never, match.id);
    expect(result.data.conversationId).toBeTruthy();
    expect((await prisma.match.findUnique({ where: { id: match.id } }))?.statut).toBe('CONTACTE');
    expect((await prisma.conversation.findUnique({
      where: { id: result.data.conversationId },
      select: { groupProfile: { select: { name: true } } },
    }))?.groupProfile?.name).toBe('Groupe');

    const conversations = await controller.conversations({ user: { userId: groupUser.id } } as never);
    expect(conversations.data).toHaveLength(1);
    expect((await controller.contacts({ user: { userId: musicianUser.id } } as never)).data).toHaveLength(1);
  });

  it("interdit l'accès à une conversation à un autre compte", async () => {
    const conversation = await prisma.conversation.create({ data: { members: { create: { userId: (await prisma.user.create({ data: { email: 'owner@example.com', password: 'hash', city: 'Strasbourg' } })).id } } } });
    await expect(
      controller.messages({ user: { userId: 'intrus' } } as never, conversation.id),
    ).rejects.toThrow('Conversation introuvable.');
  });

  it('crée une conversation depuis un profil sans match', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5, longitude: 7.7, rayonKm: 20, ville: 'Strasbourg' },
    });
    const musicianUser = await prisma.user.create({
      data: { email: 'direct-musician@example.com', password: 'hash', city: 'Strasbourg' },
    });
    await prisma.musicianProfile.create({
      data: { userId: musicianUser.id, zoneId: zone.id, status: 'AMATEUR', objective: [] },
    });
    const groupUser = await prisma.user.create({
      data: { email: 'direct-group@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: { userId: groupUser.id, zoneId: zone.id, name: 'Groupe direct', styles: [], status: 'ASSOCIATION' },
    });

    const result = await controller.contactProfile(
      { user: { userId: musicianUser.id } } as never,
      'group',
      group.id,
    );

    expect(result.data.conversationId).toBeTruthy();
    expect(await prisma.match.count()).toBe(0);
    expect(await prisma.conversationMember.count({ where: { conversationId: result.data.conversationId } })).toBe(2);
  });

  it('permet ensuite de contacter le musicien administrateur du groupe dans une conversation distincte', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5, longitude: 7.7, rayonKm: 20, ville: 'Strasbourg' },
    });
    const musicianUser = await prisma.user.create({
      data: { email: 'contacting-musician@example.com', password: 'hash', city: 'Strasbourg' },
    });
    await prisma.musicianProfile.create({
      data: { userId: musicianUser.id, zoneId: zone.id, status: 'AMATEUR', objective: [] },
    });
    const adminUser = await prisma.user.create({
      data: { email: 'admin-musician@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const adminProfile = await prisma.musicianProfile.create({
      data: { userId: adminUser.id, zoneId: zone.id, status: 'AMATEUR', objective: [], musicianName: 'Administrateur' },
    });
    const group = await prisma.groupProfile.create({
      data: { userId: adminUser.id, zoneId: zone.id, name: 'Groupe administré', styles: [], status: 'ASSOCIATION' },
    });

    const groupConversation = await controller.contactProfile(
      { user: { userId: musicianUser.id } } as never,
      'group',
      group.id,
    );
    const musicianConversation = await controller.contactProfile(
      { user: { userId: musicianUser.id } } as never,
      'musician',
      adminProfile.id,
    );

    expect(musicianConversation.data.conversationId).not.toBe(groupConversation.data.conversationId);
    expect(await prisma.conversation.count()).toBe(2);
  });

  it("réaffiche une conversation supprimée lorsque l'interlocuteur répond", async () => {
    const first = await prisma.user.create({ data: { email: 'hidden-first@example.com', password: 'hash', city: 'Strasbourg' } });
    const second = await prisma.user.create({ data: { email: 'hidden-second@example.com', password: 'hash', city: 'Strasbourg' } });
    const conversation = await prisma.conversation.create({
      data: { members: { create: [{ userId: first.id }, { userId: second.id }] } },
    });

    expect(await controller.deleteConversation({ user: { userId: first.id } } as never, conversation.id)).toMatchObject({ data: { success: true } });
    expect((await controller.conversations({ user: { userId: first.id } } as never)).data).toHaveLength(0);

    await controller.sendMessage(
      { user: { userId: second.id } } as never,
      conversation.id,
      { content: 'Je réponds après votre suppression.' },
    );

    const conversations = await controller.conversations({ user: { userId: first.id } } as never);
    expect(conversations.data).toHaveLength(1);
    expect(conversations.data[0].messages[0].content).toBe('Je réponds après votre suppression.');
  });
});
