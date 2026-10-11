import { RefreshCw } from 'lucide-react';

/**
 * `loading.tsx` do painel interno.
 *
 * Server Component puro (sem hooks, sem i18n): é o fallback do Suspense do
 * App Router e aparece durante o RSC streaming de `/admin/*`.
 */
export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="admin-dashboard flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 bg-[var(--admin-bg)] text-[var(--admin-text-muted)]"
    >
      <RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-primary)]" />
      <span className="text-xs uppercase tracking-widest">Maeum · Admin</span>
    </div>
  );
}
