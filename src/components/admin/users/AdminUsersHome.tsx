'use client';

/**
 * Usuários & Equipe.
 *
 * ## Lacunas fechadas aqui
 *
 * 1. **Não havia UI de edição.** `Edit3`, `ShieldCheck`, `ShieldAlert` e
 *    `updateUser` eram importados e nunca usados — o painel criava conta mas
 *    não conseguia corrigir nome, telefone, cargo, bio, idioma, avatar, papel
 *    nem status. Agora existe um modal completo que chama `updateUser` e
 *    `updateUserRole`.
 * 2. **Proteção do último super admin.** Rebaixar ou desativar o ÚLTIMO
 *    `super_admin` ativo tranca o painel inteiro. A checagem é feita no client
 *    (UX) E na action (autoridade — `updateUserRole`/`toggleUserActive`
 *    revalidam sessão no servidor); o toast deixa isso explícito.
 * 3. Busca sem debounce (um round-trip por tecla).
 * 4. `deleteUser` desativa (não apaga) — o texto do botão dizia "Excluir
 *    permanentemente", o que era mentira.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  createUser,
  deleteUser,
  getUsers,
  sendNotificationToAll,
  sendNotificationToUser,
  toggleUserActive,
  updateUser,
  updateUserRole,
} from '@/actions/usersActions';

import { updateUserProfile } from '@/actions/adminActions';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableSkeleton } from '@/components/admin/ui/States';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  bio: string | null;
  locale: string | null;
isActive: boolean;
  createdAt: string;
  /** `getUsers` inclui `_count.assignedLeads` no select. */
  _count?: { assignedLeads?: number };
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  jobTitle: string;
  bio: string;
  locale: string;
  role: string;
  isActive: boolean;
  password: string;
}

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  phone: '',
  avatarUrl: '',
  jobTitle: '',
  bio: '',
  locale: 'pt',
  role: 'customer',
  isActive: true,
  password: '',
};

/** Aviso individual: `sendNotificationToUser` grava uma `Notification` só. */
interface UserNoticeForm {
  title: string;
  message: string;
  type: string;
  category: string;
}

const EMPTY_NOTICE: UserNoticeForm = {
  title: '',
  message: '',
  type: 'info',
  category: 'system',
};

const NOTICE_CATEGORIES: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: 'system', labelKey: 'admin.users.categorySystem' },
  { value: 'chat', labelKey: 'admin.users.categoryChat' },
  { value: 'lead', labelKey: 'admin.users.categoryLead' },
  { value: 'booking', labelKey: 'admin.users.categoryBooking' },
  { value: 'proposal', labelKey: 'admin.users.categoryProposal' },
];


const ROLE_BADGE: Record<string, string> = {
  super_admin: 'border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/20 text-[var(--admin-primary)]',
  admin: 'border-purple-800 bg-purple-900/30 text-purple-400',
  consultora: 'border-blue-800 bg-blue-900/30 text-blue-400',
  customer: 'border-gray-700 bg-gray-800 text-gray-400',
};

export default function AdminUsersHome() {
  const { t, formatNumber, formatDate } = useLanguage();
  const { toast } = useToast();
  const { user: sessionUser } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState<UserForm>(EMPTY_FORM);
  const [superAdminConfirm, setSuperAdminConfirm] = useState('');

const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifData, setNotifData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
  });

  /* ── Aviso individual (`sendNotificationToUser`) ─────────── */
  const [noticeTarget, setNoticeTarget] = useState<UserRow | null>(null);
  const [noticeData, setNoticeData] = useState<UserNoticeForm>(EMPTY_NOTICE);
  const [noticeErrors, setNoticeErrors] = useState<Record<string, string>>({});


  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getUsers({ page, pageSize, search: debouncedSearch, role: roleFilter || undefined });
    if (res.success) {
      setUsers((res.items ?? []) as unknown as UserRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, roleFilter, t]);

  useMountedLoad(load);

  /**
   * Contagem de super admins ATIVOS — só confiável quando o filtro é "todos os
   * papéis" (ou seja, quando a lista traz o time inteiro). Se o filtro estiver
   * ativo, não assumimos nada e desabilitamos a ação destrutiva em vez de dar
   * um falso "pode rebaixar".
   */
  const superAdminStats = useMemo(() => {
    if (roleFilter !== '') return { known: false, active: 0 };
    const active = users.filter((u) => u.role === 'super_admin' && u.isActive).length;
    return { known: true, active };
  }, [users, roleFilter]);

  const isLastSuperAdmin = useCallback(
    (target: UserRow): boolean =>
      target.role === 'super_admin' &&
      target.isActive &&
      superAdminStats.known &&
      superAdminStats.active <= 1,
    [superAdminStats],
  );

  const guardSuperAdmin = useCallback(
    (target: UserRow): boolean => {
      if (!isLastSuperAdmin(target)) return false;
      toast(t('admin.users.superAdminGuard'), 'error');
      return true;
    },
    [isLastSuperAdmin, t, toast],
  );

  const openCreate = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setSuperAdminConfirm('');
    setModalMode('create');
  };

  const openEdit = (target: UserRow) => {
    setEditingUser(target);
    setFormData({
      name: target.name ?? '',
      email: target.email ?? '',
      phone: target.phone ?? '',
      avatarUrl: target.avatarUrl ?? '',
      jobTitle: target.jobTitle ?? '',
      bio: target.bio ?? '',
      locale: target.locale ?? 'pt',
      role: target.role,
      isActive: target.isActive,
      password: '',
    });
    setSuperAdminConfirm('');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setSuperAdminConfirm('');
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast(t('admin.users.name'), 'error');
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
      avatarUrl: formData.avatarUrl,
      jobTitle: formData.jobTitle,
      role: formData.role,
      password: formData.password,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast(res.temporaryPassword ? `${t('admin.users.created')} (${res.temporaryPassword})` : t('admin.users.created'));
      closeModal();
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;

    const demoting = formData.role !== editingUser.role;
    const deactivating = !formData.isActive && editingUser.isActive;
    if ((demoting || deactivating) && isLastSuperAdmin(editingUser)) {
      toast(t('admin.users.superAdminGuard'), 'error');
      return;
    }
    if (formData.role === 'super_admin' && superAdminConfirm.trim() !== formData.name.trim()) {
      toast(t('admin.users.confirmName').replace('{name}', formData.name.trim()), 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatarUrl: formData.avatarUrl,
      jobTitle: formData.jobTitle,
      isActive: formData.isActive ? 'true' : 'false',
    });

    // `bio` e `locale` não são cobertos por `usersActions.updateUser`: ficam
    // numa action própria (adminActions.updateUserProfile) para não haver
    // campo que "salva" nada em silêncio.
    const profileChanged =
      (formData.bio ?? '') !== (editingUser.bio ?? '') || formData.locale !== (editingUser.locale ?? 'pt');
    const profileRes =
      res.success && profileChanged
        ? await updateUserProfile(editingUser.id, { bio: formData.bio, locale: formData.locale })
        : null;

    // Papel tem action própria: ela incrementa `sessionVersion` e invalida as
    // sessões emitidas com o papel antigo.
    const roleRes =
      res.success && formData.role !== editingUser.role
        ? await updateUserRole(editingUser.id, formData.role)
        : null;
    setIsSubmitting(false);

    if (!res.success) {
      toast(res.error ?? t('state.errorTitle'), 'error');
      return;
    }
    if (profileRes && !profileRes.success) {
      toast(profileRes.error ?? t('state.errorTitle'), 'error');
      await load();
      return;
    }
    if (roleRes && !roleRes.success) {
      toast(roleRes.error ?? t('state.errorTitle'), 'error');
      await load();
      return;
    }
    toast(t('admin.users.updated'));
    closeModal();
    await load();
  };

  const handleToggleActive = async (target: UserRow) => {
    if (target.isActive && guardSuperAdmin(target)) return;
    const res = await toggleUserActive(target.id);
    if (res.success) {
      toast(res.data?.isActive ? t('admin.team.activated') : t('admin.team.blocked'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (target: UserRow) => {
    if (target.isActive && guardSuperAdmin(target)) return;
    if (!window.confirm(t('admin.users.deleteConfirm').replace('{name}', target.name))) return;
    const res = await deleteUser(target.id);
    if (res.success) {
      toast(t('admin.users.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

const handleBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const res = await sendNotificationToAll(notifData);
    setIsSubmitting(false);

    if (res.success) {
      toast(t('admin.users.notifySent').replace('{count}', formatNumber(res.count)));
      setIsNotifModalOpen(false);
      setNotifData({ title: '', message: '', type: 'info', priority: 'normal' });
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const openNotice = (target: UserRow) => {
    setNoticeTarget(target);
    setNoticeData(EMPTY_NOTICE);
    setNoticeErrors({});
  };

  const closeNotice = () => {
    setNoticeTarget(null);
    setNoticeErrors({});
  };

  /**
   * Aviso individual. A confirmação existe porque a mensagem entra na caixa do
   * usuário e não há como desfazer: o destinatário lê e o registro fica.
   */
  const handleSendNotice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!noticeTarget || isSubmitting) return;

    const errors: Record<string, string> = {};
    if (noticeData.title.trim().length < 2) errors.title = t('admin.users.notifySubject');
    if (noticeData.message.trim().length < 3) errors.message = t('admin.users.notifyBody');
    setNoticeErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (
      !window.confirm(
        t('admin.users.noticeConfirm')
          .replace('{name}', noticeTarget.name)
          .replace('{title}', noticeData.title.trim()),
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendNotificationToUser({
        userId: noticeTarget.id,
        title: noticeData.title.trim(),
        message: noticeData.message.trim(),
        type: noticeData.type,
        category: noticeData.category,
      });
      if (res.success) {
        toast(t('admin.users.noticeSent').replace('{name}', noticeTarget.name), 'success');
        closeNotice();
      } else {
        toast(res.error ?? t('state.errorTitle'), 'error');
      }
    } catch {
      toast(t('state.errorTitle'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const roleOptions = [
    { value: 'customer', labelKey: 'admin.users.roleCustomer' },
    { value: 'consultora', labelKey: 'admin.users.roleConsultant' },
    { value: 'admin', labelKey: 'admin.users.roleAdmin' },
    { value: 'super_admin', labelKey: 'admin.users.roleSuperAdmin' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Users className="w-5 h-5" />}
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsNotifModalOpen(true)}
              variant="outline"
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"
            >
              <Bell className="w-4 h-4 mr-1" /> {t('admin.users.notifyAll')}
            </Button>
            <Button
              onClick={openCreate}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.users.newUser')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.users.search')}
          aria-label={t('admin.users.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.users.allRoles')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.users.allRoles')}</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.team.user')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.team.contact')}</th>
                <th className="p-4 font-semibold">{t('admin.users.role')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.team.status')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
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
                  const locked = isLastSuperAdmin(row);
                  const isSelf = sessionUser?.id === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={`group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20 ${
                        row.isActive ? '' : 'opacity-60'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--admin-border)] text-[11px] font-bold text-[var(--admin-primary)]">
                            {row.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- avatar colado no painel (host fora da allowlist)
                              <img
                                src={row.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (row.name ?? '?').charAt(0).toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--admin-text-main)]">{row.name}</p>
                            <p className="text-[10px] text-[var(--admin-text-muted)]">
{t('admin.users.leadsSince')
                                .replace('{count}', formatNumber(row._count?.assignedLeads ?? 0))
                                .replace('{date}', formatDate(row.createdAt))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 sm:table-cell">
                        <div className="flex flex-col gap-0.5 text-[11px] text-[var(--admin-text-muted)]">
                          <span className="truncate">{row.email}</span>
                          <span className="truncate">{row.phone || t('admin.users.notReported')}</span>
                          {row.jobTitle && <span className="truncate">{row.jobTitle}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={row.role}
                          disabled={locked || isSelf}
                          onChange={(e) => {
                            const target = { ...row, role: e.target.value };
                            if (guardSuperAdmin(target)) return;
                            void (async () => {
                              const res = await updateUserRole(row.id, e.target.value);
                              if (res.success) {
                                toast(t('admin.users.updated'));
                                await load();
                              } else {
                                toast(res.error ?? t('state.errorTitle'), 'error');
                              }
                            })();
                          }}
                          aria-label={t('admin.users.role')}
                          title={locked ? t('admin.users.superAdminGuard') : undefined}
                          className={`cursor-pointer appearance-none rounded border px-2 py-1 text-[10px] font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            ROLE_BADGE[row.role] ?? 'border-gray-700 text-gray-400'
                          }`}
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(option.labelKey)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            row.isActive
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-gray-700 bg-gray-900/30 text-gray-500'
                          }`}
                        >
                          {row.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                        </span>
                        {locked && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-[var(--admin-primary)]">
                            <ShieldCheck className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => openNotice(row)}
                            aria-label={t('admin.users.sendNotice').replace('{name}', row.name)}
                            title={t('admin.users.sendNotice').replace('{name}', row.name)}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            aria-label={t('admin.users.editUser')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleToggleActive(row)}
                            disabled={isSelf || locked}
                            title={
                              isSelf
                                ? t('admin.team.adminOnly')
                                : locked
                                  ? t('admin.users.superAdminGuard')
                                  : row.isActive
                                    ? t('admin.team.block')
                                    : t('admin.team.unblock')
                            }
                            aria-label={row.isActive ? t('admin.team.block') : t('admin.team.unblock')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {row.isActive ? (
                              <ToggleRight className="w-4 h-4 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            disabled={isSelf || locked}
                            aria-label={t('admin.users.deleteConfirm').replace('{name}', row.name)}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* ── Criar / editar ─────────────────────────────── */}
      <AnimatePresence>
        {modalMode && (
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {modalMode === 'edit' ? t('admin.users.editUser') : t('admin.users.newUser')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <form
                id="userForm"
                onSubmit={modalMode === 'edit' ? handleUpdate : handleCreate}
                className="flex flex-col gap-4 overflow-y-auto p-6"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-name" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.name')} *
                  </label>
                  <Input
                    id="user-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user-email" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.email')} *
                    </label>
                    <Input
                      id="user-email"
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user-phone" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.phone')}
                    </label>
                    <Input
                      id="user-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user-job" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.jobTitle')}
                    </label>
                    <Input
                      id="user-job"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user-locale" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.locale')}
                    </label>
                    <select
                      id="user-locale"
                      value={formData.locale}
                      onChange={(e) => setFormData((prev) => ({ ...prev, locale: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="pt">pt</option>
                      <option value="en">en</option>
                      <option value="es">es</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-avatar" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.avatar')}
                  </label>
                  <Input
                    id="user-avatar"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    placeholder="/api/media/… ou https://…"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-bio" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.bio')}
                  </label>
                  <textarea
                    id="user-bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="flex min-h-[70px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user-role" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.role')}
                    </label>
                    <select
                      id="user-role"
                      value={formData.role}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {modalMode === 'create' ? (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="user-password" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.users.password')}
                      </label>
                      <Input
                        id="user-password"
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.users.passwordHint')}
                      </span>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 self-end pb-2 text-xs text-[var(--admin-text-main)]">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 accent-[var(--admin-primary)]"
                      />
                      {t('admin.users.active')}
                    </label>
                  )}
                </div>

                {formData.role === 'super_admin' && (
                  <div className="flex flex-col gap-2 rounded-lg border border-[var(--admin-primary)]/40 bg-[var(--admin-primary)]/5 p-3">
                    <p className="text-[11px] font-semibold text-[var(--admin-text-main)]">
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
                      className="h-9 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                )}
              </form>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)]"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="userForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting
                    ? t('admin.state.loading')
                    : modalMode === 'edit'
                      ? t('admin.common.update')
                      : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Notificação em massa ────────────────────────── */}
      <AnimatePresence>
        {isNotifModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifModalOpen(false)}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">{t('admin.users.notifyTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <form id="notifForm" onSubmit={handleBroadcast} className="flex flex-col gap-4 overflow-y-auto p-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notif-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.notifySubject')} *
                  </label>
                  <Input
                    id="notif-title"
                    required
                    value={notifData.title}
                    onChange={(e) => setNotifData((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notif-message" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.notifyBody')} *
                  </label>
                  <textarea
                    id="notif-message"
                    required
                    value={notifData.message}
                    onChange={(e) => setNotifData((prev) => ({ ...prev, message: e.target.value }))}
                    className="flex min-h-[80px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="notif-type" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.notifyType')}
                    </label>
                    <select
                      id="notif-type"
                      value={notifData.type}
                      onChange={(e) => setNotifData((prev) => ({ ...prev, type: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="info">{t('admin.users.typeInfo')}</option>
                      <option value="success">{t('admin.users.typeSuccess')}</option>
                      <option value="warning">{t('admin.users.typeWarning')}</option>
                      <option value="error">{t('admin.users.typeError')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="notif-priority" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.notifyPriority')}
                    </label>
                    <select
                      id="notif-priority"
                      value={notifData.priority}
                      onChange={(e) => setNotifData((prev) => ({ ...prev, priority: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="low">{t('admin.users.priorityLow')}</option>
                      <option value="normal">{t('admin.users.priorityNormal')}</option>
                      <option value="high">{t('admin.users.priorityHigh')}</option>
                    </select>
                  </div>
                </div>
              </form>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNotifModalOpen(false)}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)]"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="notifForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : t('admin.users.notifyAll')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Aviso individual ─────────────────────────────── */}
      <AnimatePresence>
        {noticeTarget && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeNotice}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                    {t('admin.users.noticeTitle')}
                  </h3>
                  <p className="truncate text-[11px] text-[var(--admin-text-muted)]">{noticeTarget.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeNotice}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <form id="noticeForm" onSubmit={handleSendNotice} className="flex flex-col gap-4 overflow-y-auto p-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notice-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.notifySubject')} *
                  </label>
                  <Input
                    id="notice-title"
                    required
                    value={noticeData.title}
                    onChange={(e) => setNoticeData((prev) => ({ ...prev, title: e.target.value }))}
                    aria-invalid={Boolean(noticeErrors.title)}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                  {noticeErrors.title && (
                    <span className="text-[10px] text-[var(--admin-accent-red)]">{noticeErrors.title}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notice-message" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.users.notifyBody')} *
                  </label>
                  <textarea
                    id="notice-message"
                    required
                    value={noticeData.message}
                    onChange={(e) => setNoticeData((prev) => ({ ...prev, message: e.target.value }))}
                    aria-invalid={Boolean(noticeErrors.message)}
                    className="flex min-h-[90px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                  />
                  {noticeErrors.message && (
                    <span className="text-[10px] text-[var(--admin-accent-red)]">{noticeErrors.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="notice-type" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.users.notifyType')}
                    </label>
                    <select
                      id="notice-type"
                      value={noticeData.type}
                      onChange={(e) => setNoticeData((prev) => ({ ...prev, type: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="info">{t('admin.users.typeInfo')}</option>
                      <option value="success">{t('admin.users.typeSuccess')}</option>
                      <option value="warning">{t('admin.users.typeWarning')}</option>
                      <option value="error">{t('admin.users.typeError')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="notice-category"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.users.notifyCategory')}
                    </label>
                    <select
                      id="notice-category"
                      value={noticeData.category}
                      onChange={(e) => setNoticeData((prev) => ({ ...prev, category: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      {NOTICE_CATEGORIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeNotice}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)]"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="noticeForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : t('admin.users.sendNoticeShort')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

