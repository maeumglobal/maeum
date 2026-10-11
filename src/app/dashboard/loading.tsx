/**
 * `loading.tsx` do portal (`/dashboard/*`).
 *
 * Server Component puro (sem hooks, sem i18n): é o fallback do Suspense do App
 * Router durante o RSC streaming.
 *
 * Desenha SÓ a área de conteúdo. A sidebar e o header vêm do
 * `DashboardShell` (que envolve este arquivo), então reproduzi-los aqui
 * mostraria duas vezes a moldura do portal enquanto a página carrega.
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex w-full flex-col gap-6"
    >
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="h-6 w-56 animate-pulse rounded bg-card" />
        <div className="h-3 w-72 animate-pulse rounded bg-card/70" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`metric-skeleton-${index}`} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={`row-skeleton-${index}`}
            className="h-8 animate-pulse rounded bg-card/70"
            style={{ width: `${100 - index * 6}%` }}
          />
        ))}
      </div>

      <span className="sr-only">Carregando…</span>
    </div>
  );
}