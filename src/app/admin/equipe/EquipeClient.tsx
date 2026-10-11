'use client';

/**
 * `/admin/equipe` — gestão de acessos.
 *
 * ## Correções
 *
 * 1. **`AdminGuard requireRole="admin"`** nesta tela. O layout aceita
 *    `staff` (o que inclui `consultora`), e uma consultora podia abrir o
 *    formulário que cria super admins. `usersActions` exige `requireAdmin()` em
 *    toda escrita, mas a tela ficava visível e tentava a ação para receber
 *    "acesso restrito" — agora o guard redireciona antes.
 * 2. Criar `super_admin` continua possível, mas exige **digitar o nome exato**
 *    do novo super admin no campo de confirmação, com aviso explícito.
 * 3. `handleToggleActive` não tinha `else`: falha de action era silenciosa.
 * 4. Debounce na busca + paginação (antes carregava 50 e mentia: era o máximo
 *    da action, não o total).
 * 5. O `select` de papel não revalidava nem tratava erro.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
  X,
} from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminTableSkeleton,
} from '@/components/admin/ui/States';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUser, getUsers, toggleUserActive } from '@/actions/usersActions';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

interface CreateForm {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: string;
  password: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  role: 'consultora',
  password: '',
};

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '—'
  );
}

function TeamClientInner() {
  const { t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { user: sessionUser, isAdmin } = useAuth();

  const [users, setUsers] = useState<TeamRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateForm>(EMPTY_FORM);
  const [superAdminConfirm, setSuperAdminConfirm] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getUsers({ page, pageSize, search: debouncedSearch });
    if (res.success) {
      setUsers((res.items ?? []) as unknown as TeamRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, t]);

  useMountedLoad(loadUsers);

  const superAdminCount = useMemo(
    () => (debouncedSearch ? -1 : users.filter((row) => row.role === 'super_admin' && row.isActive).length),
    [users, debouncedSearch],
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setSuperAdminConfirm('');
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast(t('admin.team.fullName'), 'error');
      return;
    }
    if (formData.role === 'super_admin' && superAdminConfirm.trim() !== formData.name.trim()) {
      toast(t('admin.users.confirmName').replace('{name}', formData.name.trim()), 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await createUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle,
      role: formData.role,
      password: formData.password,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast(
        res.temporaryPassword
          ? `${t('admin.team.created')} (${res.temporaryPassword})`
          : t('admin.team.created'),
      );
      closeModal();
      await loadUsers();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    setBusy(true);
    const res = await toggleUserActive(id);
    setBusy(false);
    if (res.success) {
      toast(res.data?.isActive ? t('admin.team.activated') : t('admin.team.blocked'));
      await loadUsers();
    } else {
      // Antes não havia `else`: a falha sumia e o usuário achava que tinha
      // bloqueado a conta.
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const roleOptions = [
    { value: 'consultora', labelKey: 'admin.users.roleConsultant' },
    { value: 'admin', labelKey: 'admin.users.roleAdmin' },
    { value: 'super_admin', labelKey: 'admin.users.roleSuperAdmin' },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <AdminPageHeader
        icon={<Users className="w-5 h-5" />}
        title={t('admin.team.title')}
        subtitle={t('admin.team.subtitle')}
        actions={
          <>
            <span className="rounded bg-[var(--admin-border)]/50 px-2 py-1 text-xs text-[var(--admin-text-muted)]">
              {formatNumber(total)}
            </span>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <UserPlus className="w-4 h-4 mr-1" /> {t('admin.team.add')}
            </Button>
          </>
        }
      />

      {!isAdmin && (
        <p className="flex items-center gap-2 rounded-lg border border-[var(--admin-accent-red)]/40 bg-[var(--admin-accent-red)]/5 p-3 text-[11px] text-[var(--admin-text-muted)]">
          <Shield className="w-3.5 h-3.5" />
          {t('admin.team.adminOnly')}
        </p>
      )}

      <Input
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        placeholder={t('admin.team.search')}
        aria-label={t('admin.team.search')}
        className="h-9 max-w-md bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
      />

      {error ? (
        <AdminErrorState message={error} onRetry={loadUsers} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[9px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                <th className="p-4 font-medium">{t('admin.team.user')}</th>
                <th className="p-4 font-medium">{t('admin.team.role')}</th>
                <th className="p-4 font-medium">{t('admin.team.contact')}</th>
                <th className="p-4 font-medium">{t('admin.team.status')}</th>
                <th className="p-4 text-right font-medium">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminTableSkeleton rows={8} columns={4} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminEmptyState
                      title={t('admin.team.empty')}
                      description={debouncedSearch ? t('state.searchEmptyHint') : undefined}
                      icon={<Users className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                users.map((row) => {
                  const isSelf = sessionUser?.id === row.id;
                  const isLastSuperAdmin =
                    row.role === 'super_admin' && row.isActive && superAdminCount === 1;
                  return (
                    <tr
                      key={row.id}
                      className={`group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/30 ${
                        row.isActive ? '' : 'opacity-60'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--admin-border)] bg-[var(--admin-bg)] text-[10px] font-bold text-[var(--admin-primary)]">
                            {row.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- avatar colado no painel (host fora da allowlist)
                              <img
                                src={row.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              initials(row.name)
                            )}
                          </span>
                          <p className="text-[11px] font-semibold text-[var(--admin-text-main)]">{row.name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded bg-[#3A141A] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--admin-primary)]">
                          {row.role === 'super_admin' ? <Shield className="w-3 h-3" /> : null}
                          {t(`admin.users.role${row.role === 'super_admin' ? 'SuperAdmin' : row.role === 'admin' ? 'Admin' : row.role === 'consultora' ? 'Consultant' : 'Customer'}`)}
                        </span>
                      </td>
                      <td className="p-4 text-[9px] text-[var(--admin-text-muted)]">
                        <p className="truncate">{row.email}</p>
                        <p className="mt-1 truncate">{row.phone || t('admin.users.notReported')}</p>
                      </td>
                      <td className="p-4">
                        {row.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> {t('admin.users.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                            <XCircle className="w-3 h-3" /> {t('admin.users.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={busy || isSelf || isLastSuperAdmin}
                          onClick={() => void handleToggleActive(row.id)}
                          title={
                            isSelf
                              ? t('admin.team.adminOnly')
                              : isLastSuperAdmin
                                ? t('admin.users.superAdminGuard')
                                : row.isActive
                                  ? t('admin.team.block')
                                  : t('admin.team.unblock')
                          }
                          className={`border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            row.isActive
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {row.isActive ? t('admin.team.block') : t('admin.team.unblock')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        disabled={loading || Boolean(error)}
      />

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-[101] max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] p-6"
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label={t('admin.common.cancel')}
                className="absolute top-4 right-4 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="mb-6 text-xl font-bold text-[var(--admin-text-main)]">
                {t('admin.team.newMember')}
              </h2>

              <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="team-name" className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                    {t('admin.team.fullName')} *
                  </label>
                  <Input
                    id="team-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="team-email" className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                    {t('admin.users.email')} *
                  </label>
                  <Input
                    id="team-email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="team-phone" className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                    {t('admin.users.phone')}
                  </label>
                  <Input
                    id="team-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="team-job" className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                    {t('admin.users.jobTitle')}
                  </label>
                  <Input
                    id="team-job"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    className="bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="team-role" className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]">
                      {t('admin.team.role')}
                    </label>
                    <select
                      id="team-role"
                      value={formData.role}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                      className="h-10 rounded-sm border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-[12px] text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="team-password"
                      className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)]"
                    >
                      {t('admin.team.password')}
                    </label>
                    <Input
                      id="team-password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    <span className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.users.passwordHint')}
                    </span>
                  </div>
                </div>

                {formData.role === 'super_admin' && (
                  <div className="flex flex-col gap-2 rounded-lg border border-[var(--admin-primary)]/40 bg-[var(--admin-primary)]/5 p-3">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-[var(--admin-text-main)]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--admin-primary)]" />
                      {t('admin.users.superAdminNew')}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.users.superAdminNewHint')}
                    </p>
                    <Input
                      value={superAdminConfirm}
                      onChange={(e) => setSuperAdminConfirm(e.target.value)}
                      placeholder={t('admin.users.confirmName').replace('{name}', formData.name.trim() || '—')}
                      aria-label={t('admin.users.superAdminNew')}
                      className="h-9 bg-[var(--admin-card)] text-[12px] text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11 w-full bg-[var(--admin-primary)] font-bold uppercase tracking-widest text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : t('admin.common.create')}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EquipeClient() {
  return (
    <AdminGuard requireRole="admin">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full flex-col gap-6"
      >
        <TeamClientInner />
      </motion.div>
    </AdminGuard>
  );
}
