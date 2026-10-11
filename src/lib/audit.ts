/**
 * Trilha de auditoria do painel.
 *
 * A versão anterior exportava `createAdminLog` de `adminActions.ts` e NENHUMA
 * action o chamava — a tela "Auditoria e Logs" mostrava sempre 2 linhas do seed.
 * Aqui a gravação é centralizada e `auditLog` é `fire-and-forget`: uma falha de
 * log nunca pode derrubar a operação de negócio.
 */
import { prisma } from '@/lib/prisma';

interface AuditInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  result?: 'success' | 'failure';
}

export function auditLog(input: AuditInput): void {
  const payload = {
    userId: input.userId,
    action: input.action.slice(0, 100),
    entity: input.entity.slice(0, 100),
    entityId: input.entityId ? String(input.entityId).slice(0, 100) : null,
    details: input.details ? String(input.details).slice(0, 2000) : null,
    ipAddress: input.ipAddress ? input.ipAddress.slice(0, 50) : null,
    userAgent: input.userAgent ? input.userAgent.slice(0, 500) : null,
    result: input.result ?? 'success',
  };

  void prisma.adminLog
    .create({ data: payload })
    .catch((error) => console.error('[audit] falha ao gravar log:', error));
}
