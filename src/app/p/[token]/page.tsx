import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildNoIndexMetadata } from '@/lib/seo';
import { getSiteConfig } from '@/actions/siteConfigActions';
import { getDictionary } from '@/i18n';
import { resolveRequestLocale, siteUrl } from '@/lib/seo';
import { CopyBox } from './CopyBox';

/**
 * Página pública de cobrança: `/p/<token>`.
 *
 * É o destino do link gerado pelo painel (ver
 * `createPaymentLink` em `src/actions/adminActions.ts`). O token é um
 * `crypto.randomUUID()` gravado em `Payment.paymentUrl` — não é enumerável e
 * não é o id do pagamento, então não dá para adivinhar nem percorrer.
 *
 * As instruções de pagamento (chave Pix, dados bancários) são lidas de
 * `SiteConfig`; se a agência ainda não cadastrou nada, a página diz isso em
 * vez de inventar uma chave.
 */
export const metadata: Metadata = buildNoIndexMetadata('Pagamento | Maeum Global', '/p');

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

function safeText(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.replace(/\0/g, '').trim().slice(0, max) : '';
}

/**
 * Uma cobrança `pending` com vencimento no passado está vencida.
 *
 * `Date.now()` fica aqui, fora do corpo do componente: esta rota é
 * `force-dynamic` (renderizada a cada request), então não existe hydration
 * para quebrar — mas o componente em si continua puro.
 */
function isOverdue(status: string, dueDate: Date | null): boolean {
  if (status !== 'pending' || dueDate === null) return false;
  return dueDate.getTime() < Date.now();
}

export default async function PaymentLinkPage({ params }: PageProps) {
  const { token } = await params;
  const cleanToken = /^[A-Za-z0-9-]{8,64}$/.test(token) ? token : '';

  if (!cleanToken) notFound();

  const [payment, locale] = await Promise.all([
    prisma.payment.findFirst({
      where: { paymentUrl: { endsWith: `/p/${cleanToken}` } },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        dueDate: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            status: true,
            startDate: true,
            client: { select: { name: true, email: true } },
            package: { select: { title: true } },
            proposal: { select: { title: true } },
          },
        },
      },
    }),
    resolveRequestLocale(),
  ]);

  if (!payment) notFound();

  const dict = getDictionary(locale);
  const tr = (key: string, fallback: string): string => dict[key] ?? fallback;

  const config = await getSiteConfig().catch(() => null);
  const section = (name: string): Record<string, string> =>
    config?.success && config.data && typeof config.data[name] === 'object' ? config.data[name] : {};

  const payments = section('payments');
  const contact = section('contact');

  const pixKey = safeText(payments.pix_key, 200);
  const pixHolder = safeText(payments.pix_holder, 200);
  const bankDetails = safeText(payments.bank_details, 600);
  const boletoNote = safeText(payments.boleto_instructions, 600);
  const transferNote = safeText(payments.transfer_instructions, 600);
  const whatsapp = safeText(contact.whatsapp, 20);
  const supportEmail = safeText(contact.email, 180) || safeText(contact.sales_email, 180);

  const currency = new Intl.NumberFormat(
    locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-ES',
    { style: 'currency', currency: 'BRL' },
  );

  const title = payment.booking?.package?.title ?? payment.booking?.proposal?.title ?? tr('admin.payPage.title', 'Pagamento');
  const clientName = payment.booking?.client?.name ?? '';
  const method = payment.paymentMethod ?? 'pix';
  const hasInstructions = Boolean(pixKey || bankDetails || boletoNote || transferNote);
  const isPaid = payment.status === 'paid';
  const overdue = isOverdue(payment.status, payment.dueDate);

  const statusLabel = isPaid
    ? tr('admin.payPage.paid', 'Pagamento confirmado')
    : overdue
      ? tr('admin.payPage.overdue', 'Vencido')
      : tr('admin.payPage.pending', 'Aguardando pagamento');

  return (
    <main className="admin-dashboard min-h-screen w-full bg-[var(--admin-bg)] px-4 py-10 text-[var(--admin-text-main)] font-sans sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link href="/" className="text-[11px] uppercase tracking-[0.3em] text-[var(--admin-primary)]">
            Maeum Global
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          {clientName && <p className="text-sm text-[var(--admin-text-muted)]">{clientName}</p>}
        </header>

        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-[var(--admin-text-muted)]">
                {tr('admin.payPage.title', 'Pagamento')}
              </dt>
              <dd className="text-xl font-bold">{currency.format(payment.amount)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--admin-text-muted)]">
                {tr('admin.payPage.status', 'Situação')}
              </dt>
              <dd
                className={`text-sm font-semibold ${
                  isPaid ? 'text-[var(--admin-accent-green)]' : overdue ? 'text-[var(--admin-accent-red)]' : ''
                }`}
              >
                {statusLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--admin-text-muted)]">
                {tr('admin.payPage.due', 'Vencimento')}
              </dt>
              <dd className="text-sm">
                {payment.dueDate
                  ? new Intl.DateTimeFormat(
                      locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-ES',
                      { dateStyle: 'long' },
                    ).format(payment.dueDate)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--admin-text-muted)]">
                {tr('admin.payPage.booking', 'Reserva')}
              </dt>
              <dd className="text-sm break-all">
                {payment.booking?.package?.title ?? payment.booking?.proposal?.title ?? payment.booking?.id ?? '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
          <h2 className="text-sm font-semibold">{tr('admin.payPage.instructions', 'Como pagar')}</h2>

          {!hasInstructions ? (
            <p className="mt-3 text-sm text-[var(--admin-text-muted)]">
              {tr(
                'admin.payPage.noInstructions',
                'A agência ainda não cadastrou as instruções de pagamento. Fale com a consultora responsável.',
              )}
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {method === 'pix' && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-[var(--admin-primary)]">
                    {tr('admin.payPage.pix', 'Pix')}
                  </h3>
                  <p className="text-xs text-[var(--admin-text-muted)]">
                    {tr(
                      'admin.payPage.pixHint',
                      'Copie a chave Pix abaixo e pague pelo app do seu banco.',
                    )}
                  </p>
                  {pixKey && (
                    <CopyBox
                      label={tr('admin.payPage.pixKey', 'Chave Pix')}
                      value={pixKey}
                      copyLabel={tr('admin.pay.copy', 'Copiar link')}
                      copiedLabel={tr('admin.pay.copied', 'Copiado!')}
                    />
                  )}
                  {pixHolder && <p className="text-xs text-[var(--admin-text-muted)]">{pixHolder}</p>}
                </div>
              )}

              {method === 'boleto' && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-[var(--admin-primary)]">
                    {tr('admin.payPage.boleto', 'Boleto')}
                  </h3>
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    {boletoNote || tr('admin.payPage.noInstructions', '—')}
                  </p>
                </div>
              )}

              {method === 'transferencia' && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-[var(--admin-primary)]">
                    {tr('admin.payPage.transfer', 'Transferência')}
                  </h3>
                  {transferNote && (
                    <p className="text-sm text-[var(--admin-text-muted)]">{transferNote}</p>
                  )}
                  {bankDetails && (
                    <pre className="whitespace-pre-wrap rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-xs text-[var(--admin-text-main)]">
                      {bankDetails}
                    </pre>
                  )}
                </div>
              )}

              {method === 'pix' && bankDetails && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-[var(--admin-primary)]">
                    {tr('admin.payPage.bankData', 'Dados bancários')}
                  </h3>
                  <pre className="whitespace-pre-wrap rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-xs text-[var(--admin-text-main)]">
                    {bankDetails}
                  </pre>
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-xs text-[var(--admin-text-muted)]">
            {tr(
              'admin.payPage.contactHint',
              'Depois de pagar, envie o comprovante. A consultora confirma a reserva.',
            )}
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
          <h2 className="text-sm font-semibold">
            {tr('admin.payPage.contact', 'Dúvidas? Fale com a gente')}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--admin-primary)] underline-offset-4 hover:underline"
              >
                WhatsApp
              </a>
            )}
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="text-[var(--admin-primary)] underline-offset-4 hover:underline">
                {supportEmail}
              </a>
            )}
            <Link href="/" className="text-[var(--admin-primary)] underline-offset-4 hover:underline">
              {siteUrl('/').replace(/^https?:\/\//, '')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
