import { safeJsonLd } from '@/lib/seo';

/**
 * Renderiza um bloco JSON-LD (schema.org) no documento.
 *
 * - Server Component puro: pode ser usado em `layout.tsx` e em qualquer page.
 * - Serializa com `safeJsonLd()`, que valida via `JSON.parse` e escapa `<`,
 *   `>`, `&`, U+2028 e U+2029 — impedindo fechamento prematuro de `<script>`.
 * - Se o payload for inválido, retorna `null` (nada quebra o render).
 */
export default function JsonLd({
  data,
  id,
}: {
  data: unknown;
  /** `id` opcional para deduplicar/referenciar um grafo já emitido. */
  id?: string;
}) {
  const json = safeJsonLd(data);
  if (!json) return null;

  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      // Serialização própria + escape de < > & (ver `safeJsonLd`).
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
