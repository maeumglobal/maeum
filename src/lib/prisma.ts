import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma singleton.
 *
 * `log: ['query']` foi REMOVIDO de propósito: ele escrevia todo SQL com os
 * parâmetros vinculados (e-mails, telefones, senhas de proposta, mensagens de
 * chat) no stdout em produção, além de custar I/O.
 * Para depurar localmente: LOG_QUERIES=1 npm run dev
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.LOG_QUERIES === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
