/**
 * Roteamento de chats para a equipe de atendimento.
 *
 * Regra do BRIEF: `Chat.consultantId` é SEMPRE um `User` com papel de equipe
 * (`consultora` | `admin` | `super_admin`) e `isActive = true`. A versão anterior
 * caía no fallback "qualquer usuário ativo" e podia atribuí-la a um `customer` —
 * basta um `where: { isActive: true }`.
 *
 * Critério (round-robin por carga, sem `Consultant.leadCount` no schema):
 *   1. MENOR número de conversas com `status = 'open'` — distribuição de carga;
 *   2. empate → atendente mais ANTIGA (`User.createdAt`) — quem está esperando há
 *      mais tempo recebe a próxima conversa;
 *   3. empate residual → `id` ascendente, para o resultado ser determinístico.
 *
 * Tudo numa ÚNICA query (`_count` filtrado por relação), sem N+1.
 */
import { prisma } from '@/lib/prisma';
import { STAFF_ROLES } from '@/lib/session';

export interface RoutedConsultant {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
}

export const CHAT_ROUTING_ERROR =
  'Nenhuma atendente ativa está disponível no momento. Tente novamente mais tarde ou fale conosco pelo WhatsApp.';

/** `role IN (consultora, admin, super_admin) AND isActive = true` — nunca `customer`. */
export async function pickAvailableConsultant(options: {
  /** Ignora esta atendente (ex.: quem já está com a conversa). */
  excludeConsultantId?: string | null;
} = {}): Promise<RoutedConsultant | null> {
  const exclude = options.excludeConsultantId ?? null;

  const rows = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [...STAFF_ROLES] },
      ...(exclude ? { id: { not: exclude } } : {}),
    },
    // Já vem na ordem do desempate: mais antiga primeiro.
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 100,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      jobTitle: true,
      _count: { select: { chats: { where: { status: 'open' } } } },
    },
  });

  if (rows.length === 0) return null;

  let best = rows[0]!;
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]!;
    // `Array.prototype` mantém a primeira ocorrência do empate → createdAt.
    if (row._count.chats < best._count.chats) best = row;
  }

  return { id: best.id, name: best.name, avatarUrl: best.avatarUrl, jobTitle: best.jobTitle };
}

/**
 * Lista pública da equipe (widget do site).
 *
 * Substitui o antigo `getUsers({ role: 'consultora' })`, que expunha nome,
 * e-mail, telefone, papel e `isActive` de TODAS as usuárias para qualquer
 * visitante anônimo da página /contato. Aqui o `select` é explícito e
 * `isActive = true` já vem no WHERE.
 */
export async function listPublicConsultants(): Promise<
  Array<{ id: string; name: string; avatarUrl: string | null; jobTitle: string | null; isActive: boolean }>
> {
  return prisma.user.findMany({
    where: { role: 'consultora', isActive: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: 50,
    select: { id: true, name: true, avatarUrl: true, jobTitle: true, isActive: true },
  });
}
