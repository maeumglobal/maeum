import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildNoIndexMetadata, resolveRequestLocale } from '@/lib/seo';
import { getDictionary } from '@/i18n';
import { intlLocale, localizedPath } from '@/i18n/config';
import PropostaClient from './PropostaClient';

/**
 * Link privado de proposta: `/proposta/<unique_link>`.
 *
 * ## Segurança
 *
 * - **Busca só pelo token.** O `where` é `{ uniqueLink, status: { notIn: ['draft'] } }`.
 *   A versão anterior chamava `getProposalByLinkAction(link)`, que aceitava o
 *   `id` cru — dava para enumerar todas as propostas do banco via
 *   `/proposta/<uuid>`. Aqui o `id` não é aceito em hipótese alguma.
 * - **Rascunho não é público.** Uma proposta em `draft` ainda está sendo montada
 *   pela consultora e não pode ser aberta pelo link.
 * - **`noindex, nofollow` em todos os níveis** (canonical + googleBot via
 *   `buildNoIndexMetadata`, mais o override explícito abaixo). É um documento
 *   comercial com dados de contato de cliente: nunca indexar.
 *
 * ## `viewedAt` uma única vez
 *
 * O carimbo é gravado com um `updateMany` condicionado a `status = 'sent'`:
 * se duas requisições chegarem juntas, só uma satisfaz o `where` e só uma
 * escreve. Reler a página não muda `viewedAt`. É a mesma garantia de
 * idempotência do `clientKey` do chat, sem precisar de action.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...buildNoIndexMetadata('Proposta | Maeum Global', '/proposta'),
    // Reforço explícito: link privado nunca entra em índice nem segue links.
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ unique_link: string }>;
}

/**
 * Uma proposta está expirada quando o prazo venceu e ela ainda não foi
 * aprovada (a aprovada continua legível para o cliente conferir o fechado).
 *
 * `Date.now()` fica AQUI, fora do corpo do componente, pelo mesmo motivo de
 * `src/app/p/[token]/page.tsx`: a rota é `force-dynamic` (uma renderização por
 * request), então não existe hydration para quebrar — mas o componente em si
 * continua puro para o React Compiler.
 */
function isExpired(validUntil: Date | null, status: string): boolean {
  if (!validUntil || status === 'approved') return false;
  return validUntil.getTime() < Date.now();
}

interface ProposalView {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  version: number;
  notes: string | null;
  validUntil: Date | null;
  viewedAt: Date | null;
  updatedAt: Date;
  uniqueLink: string;
  customer: { name: string } | null;
  consultant: { name: string; email: string; phone: string | null };
  items: Array<{
    id: string;
    name: string;
    type: string;
    quantity: number;
    price: number;
    details: string | null;
  }>;
}

export default async function PublicProposalPage({ params }: PageProps) {
  const { unique_link: rawLink } = await params;

  // Token: alfabeto mínimo, 8–64 chars. Qualquer outra coisa é 404 imediato.
  const link = /^[A-Za-z0-9-]{8,64}$/.test(rawLink) ? rawLink : '';
  if (!link) notFound();

  const [locale, existing] = await Promise.all([
    resolveRequestLocale(),
    prisma.proposal.findFirst({
      where: { uniqueLink: link, status: { notIn: ['draft'] } },
      select: {
        id: true,
        title: true,
        status: true,
        totalValue: true,
        version: true,
        notes: true,
        validUntil: true,
        viewedAt: true,
        updatedAt: true,
        uniqueLink: true,
        customer: { select: { name: true } },
        consultant: { select: { name: true, email: true, phone: true } },
        items: {
          orderBy: { id: 'asc' },
          take: 60,
          select: { id: true, name: true, type: true, quantity: true, price: true, details: true },
        },
      },
    }),
  ]);

  if (!existing || !existing.uniqueLink) notFound();
  if (isExpired(existing.validUntil, existing.status)) notFound();

  // Carimba a primeira visualização — uma única vez, no próprio `where`.
  if (existing.status === 'sent') {
    await prisma.proposal
      .updateMany({
        where: { id: existing.id, status: 'sent' },
        data: { status: 'viewed', viewedAt: new Date() },
      })
      .catch(() => undefined);
  }

  const dict = getDictionary(locale);
  const tr = (key: string, fallback: string): string => dict[key] ?? fallback;

  const money = new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'BRL',
  });
  const day = new Intl.DateTimeFormat(intlLocale[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const proposal: ProposalView = {
    id: existing.id,
    title: existing.title,
    status: existing.status === 'sent' ? 'viewed' : existing.status,
    totalValue: Number.isFinite(existing.totalValue) ? existing.totalValue : 0,
    version: existing.version,
    notes: existing.notes,
    validUntil: existing.validUntil,
    viewedAt: existing.status === 'sent' ? new Date() : existing.viewedAt,
    updatedAt: existing.updatedAt,
    uniqueLink: existing.uniqueLink,
    customer: existing.customer,
    consultant: existing.consultant,
    items: existing.items,
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 md:px-8">
      <div className="flex flex-col gap-2">
        <Link href={localizedPath('/', locale)} className="text-[11px] uppercase tracking-[0.3em] text-accent">
          Maeum Global
        </Link>
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          {tr('admin.prop.privateNotice', 'Link privado de uso único da sua consultora. Não compartilhe publicamente.')}
        </p>
      </div>

      <PropostaClient
        proposal={{
          ...proposal,
          // Datas viram string ISO: passar `Date` por props de Server Component
          // é permitido, mas o DTO fica explícito e serializável.
          validUntil: proposal.validUntil ? proposal.validUntil.toISOString() : null,
          viewedAt: proposal.viewedAt ? proposal.viewedAt.toISOString() : null,
          updatedAt: proposal.updatedAt.toISOString(),
        }}
        copy={{
          kicker: tr('admin.prop.versionLabel', 'Versão {version}').replace(
            '{version}',
            String(proposal.version),
          ),
          updatedAt: tr('admin.prop.updatedAt', 'Atualizada em {date}').replace('{date}', day.format(proposal.updatedAt)),
          client: tr('admin.prop.client', 'Cliente'),
          consultant: tr('admin.prop.consultant', 'Consultora'),
          items: tr('admin.prop.items', 'Itens do itinerário'),
          itemPlaceholder: tr('admin.prop.itemPlaceholder', 'Serviço personalizado de turismo.'),
          total: tr('admin.prop.total', 'Total do orçamento'),
          validUntil: tr('admin.prop.validUntil', 'Válida até'),
          noValidUntil: tr('admin.prop.noValidUntil', 'Sem prazo de validade'),
          viewedAt: tr('admin.prop.viewedAt', 'Visualizada em {date}'),
          conditionsTitle: tr('admin.prop.conditionsTitle', 'Condições'),
          conditionsBody: tr(
            'admin.prop.conditionsBody',
            'Valores sujeitos à disponibilidade e à confirmação da reserva.',
          ),
          contactHint: tr('admin.prop.contactHint', 'Dúvidas? Fale com a consultora que preparou esta proposta.'),
          approve: tr('admin.prop.approve', 'Aprovar proposta'),
          approveConfirm: tr('admin.prop.approveConfirm', 'Confirmar a aprovação desta proposta?'),
          requestChanges: tr('admin.prop.requestChanges', 'Solicitar alterações'),
          changesConfirm: tr('admin.prop.changesConfirm', 'Enviar a solicitação de alterações?'),
          changesLabel: tr('admin.prop.changesLabel', 'O que você gostaria de alterar?'),
          changesPlaceholder: tr('admin.prop.changesPlaceholder', 'Ex: trocar a categoria do hotel.'),
          sending: tr('admin.prop.sending', 'Enviando...'),
          approvedOk: tr('admin.prop.approvedOk', 'Aprovação registrada. A consultora foi notificada.'),
          changesOk: tr('admin.prop.changesOk', 'Solicitação de alteração enviada.'),
          error: tr('admin.cons.dataError', 'Não foi possível concluir a operação.'),
          cancel: tr('admin.common.cancel', 'Cancelar'),
          statusApproved: tr('admin.prop.statusApproved', 'Aprovada'),
          statusRejected: tr('admin.prop.statusRejected', 'Rejeitada'),
          statusDraft: tr('admin.prop.statusDraft', 'Rascunho'),
          statusSent: tr('admin.prop.statusSent', 'Enviada'),
          statusViewed: tr('admin.prop.statusViewed', 'Visualizada'),
          statusExpired: tr('admin.prop.statusExpired', 'Expirada'),
          home: tr('admin.nav.home', 'Início'),
          dashboard: tr('admin.portal.myPanel', 'Meu painel'),
        }}
        formatted={{
          total: money.format(proposal.totalValue),
          items: proposal.items.map((item) => ({
            id: item.id,
            unit: money.format(Number.isFinite(item.price) ? item.price : 0),
            line: money.format(
              (Number.isFinite(item.price) ? item.price : 0) * (item.quantity > 0 ? item.quantity : 1),
            ),
          })),
          validUntil: proposal.validUntil ? day.format(proposal.validUntil) : '',
          viewedAt: proposal.viewedAt ? day.format(proposal.viewedAt) : '',
        }}
      />
    </main>
  );
}