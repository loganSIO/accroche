import { PrismaClient } from '@prisma/client';

// Instance partagée du client Prisma — un seul point de connexion à la base
// pour toute l'application, plutôt qu'une instance par repository.
export const prisma = new PrismaClient();