'use server';

/**
 * CRM: assinatura de proposta pelo link público.
 *
 * ## Onde a proposta é LIDA
 *
 * `src/app/proposta/[unique_link]/page.tsx` é server component e consulta o
 * Prisma direto por `{ uniqueLink, status: { notIn: ['draft'] } }`. Nunca houve
 * motivo para duplicar essa leitura numa server action — a versão anterior
 * (`getProposalByLinkAction`) também casava por `id` cru, o que permitia
 * enumerar todas as propostas do banco via `/proposta/<uuid>`. Foi removida.
 *
 * ## Autorização de `updateProposalStatusAction`
 *
 *  - **com sessão**: precisa ser o cliente da proposta, a consultora dela, ou
 *    super_admin/admin;
 *  - **sem sessão**: precisa enviar `linkToken` (o `uniqueLink` da URL), que é a
 *    prova de posse do documento — é o que a página pública sempre envia;
 *  - **nunca** aceita apenas o `id`.
 *
 * ## Duplicatas mortas removidas (nenhum import no projeto)
 *
 *  - `submitLeadAction`        -> `tripPlanActions.submitTripPlanAction`
 *  - `submitChatMessageAction` -> `chatActions.sendVisitorMessage`/`staffSendMessage`
 *    (a versão removida escrevia em qualquer `chatId`: era um IDOR)
 *  - `uploadDocumentAction`    -> `clientActions.uploadClientDocument`
 *  - `createProposalAction`    -> `businessActions.createProposal`
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { isStaff } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import { str } from '@/lib/validate';
import { fail, failPublic, ok, type ActionResult } from '@/lib/actionKit';
import { allowFormAction, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';

/** Transições que o cliente pode pedir pelo link. */
const PROPOSAL_STATUSES = ['approved', 'changes_requested'] as const;
type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** Status gravado no banco para cada decisão do cliente. */
const STATUS_FOR_DECISION: Record<ProposalStatus, string> = {
  approved: 'approved',
  changes_requested: 'sent',
};

function revalidateCrm() {
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/consultora');
  revalidatePath('/dashboard/cliente');
  revalidatePath('/proposta/[unique_link]', 'page');
}

/**
 * Aprovar a proposta ou pedir alterações.
 *
 * @param proposalId  id da proposta
 * @param status      'approved' | 'changes_requested'
 * @param notes       motivo (usado só em 'changes_requested')
 * @param linkToken   `uniqueLink` da URL — prova de posse quando não há sessão
 */
export async function updateProposalStatusAction(
  proposalId: string,
  status: string,
  notes?: string,
  linkToken?: string,
): Promise<ActionResult<{ status: string }>> {
  try {
    const decision = str(status, 40) as ProposalStatus;
    if (!PROPOSAL_STATUSES.includes(decision)) {
      return { success: false, error: 'Decisão inválida.' };
    }

    const id = str(proposalId, 64);
    if (!id) return { success: false, error: 'Proposta não encontrada.' };

    const reason = str(notes, 2000);
    if (decision === 'changes_requested' && reason.length < 3) {
      return { success: false, error: 'Descreva o que precisa ser ajustado.' };
    }

    // O link público é a única porta sem sessão: limita por IP.
    const auth = await getAuth();
    if (!auth && !str(linkToken, 120)) {
      return { success: false, error: 'Link de proposta inválido.' };
    }
    if (!auth && !allowFormAction(`proposal:${id}`)) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        customerId: true,
        consultantId: true,
        uniqueLink: true,
        viewedAt: true,
        validUntil: true,
        title: true,
        consultant: { select: { name: true } },
      },
    });
    if (!proposal) return { success: false, error: 'Proposta não encontrada.' };

    // Sem sessão, o token precisa bater com o link real da proposta.
    if (!auth) {
      if (!proposal.uniqueLink || proposal.uniqueLink !== str(linkToken, 120)) {
        return { success: false, error: 'Link de proposta inválido.' };
      }
    } else {
      const isOwner = proposal.customerId === auth.user.id;
      const isConsultant = proposal.consultantId === auth.user.id;
      if (!isOwner && !isConsultant && !isStaff(auth.user.role)) {
        return { success: false, error: 'Você não tem permissão para esta proposta.' };
      }
      // Admin e consultora também precisam do token quando não são o dono.
      if (!isOwner && proposal.uniqueLink && proposal.uniqueLink !== str(linkToken, 120)) {
        return { success: false, error: 'Link de proposta inválido.' };
      }
    }

    if (proposal.status === 'approved') {
      return { success: false, error: 'Esta proposta já foi aprovada.' };
    }
    if (proposal.validUntil && proposal.validUntil < new Date()) {
      return { success: false, error: 'Esta proposta expirou. Peça uma nova versão.' };
    }

    const nextStatus = STATUS_FOR_DECISION[decision];
    const updated = await prisma.proposal.update({
      where: { id },
      data: {
        status: nextStatus,
        notes: reason.length ? reason : proposal.status === 'changes_requested' ? null : undefined,
        version: decision === 'approved' ? { increment: 1 } : undefined,
        viewedAt: proposal.viewedAt ?? new Date(),
      },
      select: { status: true },
    });

    auditLog({
      userId: auth?.user.id ?? proposal.consultantId,
      action: decision === 'approved' ? 'crm.proposal_approved' : 'crm.proposal_changes_requested',
      entity: 'Proposal',
      entityId: id,
      details: reason.slice(0, 500) || null,
      result: 'success',
    });

    // Avisa a consultora responsável.
    notifyUser(proposal.consultantId, {
      title: decision === 'approved' ? 'Proposta aprovada!' : 'O cliente pediu ajustes',
      message:
        decision === 'approved'
          ? `${proposal.title} foi aprovada pelo cliente.`
          : `${proposal.title}: o cliente pediu ajustes.`,
      type: decision === 'approved' ? 'success' : 'warning',
      priority: 'high',
      category: 'proposal',
      linkUrl: `/dashboard/consultora`,
    });

    revalidateCrm();
    return ok({ status: updated.status });
  } catch (error) {
    // `auth` está no escopo do try; no catch revalidamos a sessão para não vazar
    // detalhes internos para quem chegou sem login.
    return (await getAuth()) ? fail(error) : failPublic('Não foi possível registrar sua decisão.');
  }
}
