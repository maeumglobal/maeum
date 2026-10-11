import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { resolveRequestLocale, localizedPathname } from '@/lib/seo';
import { getDictionary } from '@/i18n';

/**
 * `not-found.tsx` de `/proposta/<unique_link>`.
 *
 * É o que o cliente vê quando o link não existe, foi revogado, ainda é
 * RASCUNHO (proposta em preparação não é pública) ou o prazo de validade
 * venceu. Sem isto ele cairia no 404 genérico do site, que sugere "ver
 * destinos" — o oposto do que alguém que abriu um link de proposta precisa.
 *
 * Server Component puro (sem hooks) para funcionar tanto em streaming quanto
 * após `notFound()`.
 */
export default async function ProposalNotFound() {
  const locale = await resolveRequestLocale();
  const dict = getDictionary(locale);
  const tr = (key: string, fallback: string): string => dict[key] ?? fallback;

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 bg-background px-6 py-24 text-center text-foreground">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
        <FileQuestion className="h-6 w-6 text-accent" aria-hidden />
      </span>

      <div className="max-w-xl">
        <h1 className="font-heading text-3xl font-light text-foreground sm:text-4xl">
          {tr('admin.prop.notFoundTitle', 'Proposta não encontrada')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {tr(
            'admin.prop.notFoundHint',
            'O link pode ter expirado, sido revogado ou estar incorreto.',
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {tr('admin.prop.contactHint', 'Dúvidas? Fale com a consultora que preparou esta proposta.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href={localizedPathname('/contato', locale)}
          className="inline-flex items-center gap-2 bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-accent-hover"
        >
          {tr('admin.payPage.contact', 'Dúvidas? Fale com a gente')}
        </Link>
        <Link
          href={localizedPathname('/dashboard', locale)}
          className="text-xs font-bold uppercase tracking-widest text-accent underline-offset-4 hover:underline"
        >
          {tr('admin.portal.myPanel', 'Meu painel')}
        </Link>
        <Link
          href={localizedPathname('/', locale)}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {tr('admin.nav.home', 'Início')}
        </Link>
      </div>
    </main>
  );
}