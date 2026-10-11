'use client';

/**
 * Client wrapper de `/proposta/<unique_link>`.
 *
 * A página é um Server Component (`noindex`, busca por token, carimbo de
 * `viewedAt`); aqui ficam só os controles que precisam de estado:
 * confirmação antes de aprovar e o formulário de alterações.
 *
 * ## Autorização das ações
 *
 * Esta rota é PÚBLICA — quem chega é o destinatário do link, não necessariamente
 * um usuário logado. Por isso `updateProposalStatusAction` é chamada SEMPRE com
 * o 4º argumento `linkToken = uniqueLink`: é a prova de posse do documento. Sem
 * ele (e sem sessão) a action recusa a operação.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { updateProposalStatusAction } from '@/actions/crmActions';

export interface ProposalItemView {
  id: string;
  name: string;
  type: string;
  quantity: number;
  details: string | null;
}

export interface ProposalView {
  id: string;
  title: string;
  status: string;
  version: number;
  notes: string | null;
  uniqueLink: string;
  customer: { name: string } | null;
  consultant: { name: string; email: string; phone: string | null };
  items: ProposalItemView[];
  validUntil: string | null;
  viewedAt: string | null;
  updatedAt: string;
}

export interface ProposalCopy {
  kicker: string;
  updatedAt: string;
  client: string;
  consultant: string;
  items: string;
  itemPlaceholder: string;
  total: string;
  validUntil: string;
  noValidUntil: string;
  viewedAt: string;
  conditionsTitle: string;
  conditionsBody: string;
  contactHint: string;
  approve: string;
  approveConfirm: string;
  requestChanges: string;
  changesConfirm: string;
  changesLabel: string;
  changesPlaceholder: string;
  sending: string;
  approvedOk: string;
  changesOk: string;
  error: string;
  cancel: string;
  statusApproved: string;
  statusRejected: string;
  statusDraft: string;
  statusSent: string;
  statusViewed: string;
  statusExpired: string;
  home: string;
  dashboard: string;
}

export interface ProposalFormatted {
  total: string;
  items: Array<{ id: string; unit: string; line: string }>;
  validUntil: string;
  viewedAt: string;
}

type Pending = null | 'approve' | 'changes';

export default function PropostaClient({
  proposal,
  copy,
  formatted,
}: {
  proposal: ProposalView;
  copy: ProposalCopy;
  formatted: ProposalFormatted;
}) {
  const [status, setStatus] = useState(proposal.status);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [notes, setNotes] = useState('');

  const statusLabel = (() => {
    switch (status) {
      case 'approved':
        return copy.statusApproved;
      case 'rejected':
        return copy.statusRejected;
      case 'draft':
        return copy.statusDraft;
      case 'sent':
        return copy.statusSent;
      case 'expired':
        return copy.statusExpired;
      default:
        return copy.statusViewed;
    }
  })();

  const statusClass = (() => {
    switch (status) {
      case 'approved':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
      case 'rejected':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      default:
        return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
    }
  })();

  const decided = status === 'approved' || status === 'rejected' || status === 'draft';

  const run = async (action: 'approved' | 'changes_requested') => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await updateProposalStatusAction(
        proposal.id,
        action,
        action === 'approved' ? undefined : notes.trim(),
        // 4º argumento: o próprio token da URL. É a prova de posse do link.
        proposal.uniqueLink,
      );

      if (!res.success) {
        setFeedback({ tone: 'error', text: res.error ?? copy.error });
        setPending(null);
        return;
      }

      // A action devolve o registro novo: usamos o status real do servidor em
      // vez de adivinhar. `requestProposalChanges` volta a proposta para
      // `draft` enquanto a consultora prepara a nova versão.
      const updated = res.data as { status?: string } | undefined;
      setStatus(typeof updated?.status === 'string' ? updated.status : action === 'approved' ? 'approved' : 'draft');
      setFeedback({
        tone: 'success',
        text: action === 'approved' ? copy.approvedOk : copy.changesOk,
      });
      setPending(null);
      setNotes('');
    } catch {
      setFeedback({ tone: 'error', text: copy.error });
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const consultantPhone = (proposal.consultant.phone ?? '').replace(/[^\d+]/g, '');

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              {copy.kicker}
            </span>
            <h1 className="mt-1 font-heading text-3xl font-light uppercase leading-tight text-foreground">
              {proposal.title}
            </h1>
            <span className="mt-1 block text-[10px] text-muted-foreground">{copy.updatedAt}</span>
          </div>
          <span
            className={`shrink-0 self-start whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.client}</dt>
            <dd className="text-sm font-semibold text-foreground">{proposal.customer?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.consultant}</dt>
            <dd className="text-sm font-semibold text-foreground">{proposal.consultant.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {proposal.validUntil ? copy.validUntil : copy.noValidUntil}
            </dt>
            <dd className="text-sm font-semibold text-foreground">
              {proposal.validUntil ? formatted.validUntil : '—'}
            </dd>
          </div>
        </dl>

        {proposal.viewedAt && (
          <p className="text-[10px] text-muted-foreground">
            {copy.viewedAt.replace('{date}', formatted.viewedAt)}
          </p>
        )}

        {proposal.notes && (
          <p className="rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground/85">
            {proposal.notes}
          </p>
        )}
      </header>

      {/* Itens */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{copy.items}</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {copy.items}
                </th>
                <th scope="col" className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {copy.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item) => {
                const money = formatted.items.find((row) => row.id === item.id);
                return (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        {item.type}
                      </span>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-light text-muted-foreground">
                        {item.details ?? copy.itemPlaceholder}
                      </p>
                      {item.quantity > 1 && money && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {`${item.quantity} × ${money.unit}`}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-heading text-sm font-bold text-primary">
                      {money?.line ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {proposal.items.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-muted-foreground">
                    {copy.itemPlaceholder}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="pt-5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {copy.total}
                </th>
                <td className="whitespace-nowrap pt-5 text-right font-heading text-3xl font-bold text-primary">
                  {formatted.total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Condições */}
      <section className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
          {copy.conditionsTitle}
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.conditionsBody}</p>
        <p className="text-xs text-muted-foreground">{copy.contactHint}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
          <a href={`mailto:${proposal.consultant.email}`} className="text-accent hover:underline">
            {proposal.consultant.email}
          </a>
          {consultantPhone && (
            <a href={`tel:${consultantPhone}`} className="text-accent hover:underline">
              {proposal.consultant.phone}
            </a>
          )}
          <Link href="/" className="text-accent hover:underline">
            {copy.home}
          </Link>
          <Link href="/dashboard" className="text-accent hover:underline">
            {copy.dashboard}
          </Link>
        </div>
      </section>

      {/* Ações */}
      {feedback && (
        <p
          role="status"
          className={`rounded-xl border p-4 text-center text-xs font-semibold ${
            feedback.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {!decided && (
        <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:p-8">
          {pending === null && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPending('approve')}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {copy.approve}
              </button>
              <button
                type="button"
                onClick={() => setPending('changes')}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {copy.requestChanges}
              </button>
            </div>
          )}

          {pending === 'approve' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">{copy.approveConfirm}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void run('approved')}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {busy ? copy.sending : copy.approve}
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={busy}
                  className="rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          )}

          {pending === 'changes' && (
            <div className="flex flex-col gap-3">
              <label htmlFor="proposal-changes" className="text-xs font-bold uppercase tracking-wider text-foreground">
                {copy.changesLabel}
              </label>
              <textarea
                id="proposal-changes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={copy.changesPlaceholder}
                className="w-full resize-y rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
              <p className="text-xs font-semibold text-foreground">{copy.changesConfirm}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void run('changes_requested')}
                  disabled={busy || notes.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {busy ? copy.sending : copy.requestChanges}
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={busy}
                  className="rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}