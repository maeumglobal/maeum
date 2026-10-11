'use server';

/**
 * Configuração do site (`SiteConfig`) e navegação (`NavigationItem`).
 *
 * Autorização: LEITURA de `getSiteConfig()` é PÚBLICA — o site (layout, header,
 * footer) consome esses valores. `getPublicSiteConfig()` é a variante
 * server-side já normalizada com defaults seguros, para uso em Server
 * Components. Escrita é `requireAdmin()`.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { str, strOrNull, toInt, toBool, isValidEmail, normalizeEmail, safeUrl } from '@/lib/validate';
import { pick, fail, ok, type ActionInput, type ActionResult } from '@/lib/actionKit';

export interface PublicSiteConfig {
  brand: { name: string; tagline: string; logoUrl: string; faviconUrl: string };
  contact: { email: string; salesEmail: string; phone: string; whatsapp: string; address: string };
  social: { instagram: string; facebook: string; youtube: string; tiktok: string; pinterest: string };
  seo: { titleSuffix: string; metaDescription: string };
  legal: { cnpj: string; companyName: string; privacyUrl: string; termsUrl: string; refundUrl: string };
  visual: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
}

const DEFAULT_CONFIG: PublicSiteConfig = {
  brand: {
    name: 'Maeum Global',
    tagline: 'Viagens de Luxo, Intercâmbios e Experiências Exclusivas na Ásia',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
  },
  contact: { email: '', salesEmail: '', phone: '', whatsapp: '', address: '' },
  social: { instagram: '', facebook: '', youtube: '', tiktok: '', pinterest: '' },
  seo: { titleSuffix: '| Maeum Global Travel', metaDescription: '' },
  legal: {
    cnpj: '',
    companyName: 'Maeum Global',
    privacyUrl: '/politica-de-privacidade',
    termsUrl: '/termos-de-uso',
    refundUrl: '/reembolso',
  },
  visual: {
    primaryColor: '#D4AF37',
    secondaryColor: '#1C0A10',
    accentColor: '#C8A27C',
    backgroundColor: '#110508',
  },
};

const SECTIONS = ['brand', 'contact', 'social', 'seo', 'legal', 'visual'] as const;
const MAX_KEYS_PER_SECTION = 60;
const MAX_VALUE_LEN = 2000;

const NAV_SELECT = {
  id: true,
  parentId: true,
  navigationType: true,
  label: true,
  labelEn: true,
  labelEs: true,
  url: true,
  icon: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
} as const;

function revalidateConfig() {
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/admin');
}

/** Achata a estrutura para o formato `section → chave → valor`. */
function flatten(): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const section of SECTIONS) out[section] = {};
  return out;
}

// ─── LEITURA ────────────────────────────────────────────────

export async function getSiteConfig(): Promise<ActionResult<Record<string, Record<string, string>>>> {
  try {
    const rows = await prisma.siteConfig.findMany({
      orderBy: [{ section: 'asc' }, { configKey: 'asc' }],
      take: 500,
      select: { section: true, configKey: true, value: true },
    });

    const result = flatten();
    for (const row of rows) {
      if (!result[row.section]) result[row.section] = {};
      result[row.section][row.configKey] = row.value;
    }
    return ok(result);
  } catch (error) {
    return fail(error, 'Erro ao buscar configurações.');
  }
}

/**
 * Config já normalizada para uso server-side (layout/header/footer/metadata).
 * Mescla o banco com os defaults e descarta URLs perigosas.
 */
export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const merged: PublicSiteConfig = {
    brand: { ...DEFAULT_CONFIG.brand },
    contact: { ...DEFAULT_CONFIG.contact },
    social: { ...DEFAULT_CONFIG.social },
    seo: { ...DEFAULT_CONFIG.seo },
    legal: { ...DEFAULT_CONFIG.legal },
    visual: { ...DEFAULT_CONFIG.visual },
  };

  try {
    const rows = await prisma.siteConfig.findMany({
      orderBy: [{ section: 'asc' }, { configKey: 'asc' }],
      take: 500,
      select: { section: true, configKey: true, value: true },
    });

    for (const row of rows) {
      const value = (row.value || '').slice(0, MAX_VALUE_LEN);
      const url = safeUrl(value);
      switch (row.section) {
        case 'brand':
          applyText(merged.brand, row.configKey, value, 'name', 'tagline');
          if (url) applyText(merged.brand, row.configKey, url, 'logoUrl', 'faviconUrl');
          break;
        case 'contact':
          if (row.configKey === 'email' || row.configKey === 'sales_email') {
            const email = normalizeEmail(value);
            if (!value || isValidEmail(email)) applyText(merged.contact, row.configKey, email, 'email', 'salesEmail');
          } else {
            applyText(merged.contact, row.configKey, value, 'phone', 'whatsapp', 'address');
          }
          break;
        case 'social':
          if (url) applyText(merged.social, row.configKey, url, 'instagram', 'facebook', 'youtube', 'tiktok', 'pinterest');
          break;
        case 'seo':
          applyText(merged.seo, row.configKey, value, 'titleSuffix', 'metaDescription');
          break;
        case 'legal':
          if (row.configKey === 'privacy_url' || row.configKey === 'terms_url' || row.configKey === 'refund_url') {
            if (url) applyText(merged.legal, row.configKey, url, 'privacyUrl', 'termsUrl', 'refundUrl');
          } else {
            applyText(merged.legal, row.configKey, value, 'cnpj', 'companyName');
          }
          break;
        case 'visual':
          if (/^#[0-9a-f]{3,8}$/i.test(value)) applyText(merged.visual, row.configKey, value, 'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor');
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.error('[siteConfig] falha ao ler config pública:', error instanceof Error ? error.message : error);
  }

  return merged;
}

/** Só a equipe; a tela de config não precisa de contato/redes de terceiros. */
export async function getNavigationItems(navigationType?: string): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.navigationItem.findMany({
      where: navigationType ? { navigationType: String(navigationType).slice(0, 30) } : {},
      orderBy: [{ navigationType: 'asc' }, { sortOrder: 'asc' }],
      take: 300,
      select: NAV_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar itens de navegação.');
  }
}

// ─── ESCRITA ────────────────────────────────────────────────

export async function updateSiteConfigSection(section: string, values: Record<string, string>): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    const cleanSection = String(section ?? '').slice(0, 40);
    if (!cleanSection) return { success: false, error: 'Seção inválida.' };

    await persistSection(ctx.user.id, cleanSection, values);
    revalidateConfig();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao salvar configurações.');
  }
}

export async function updateFullSiteConfig(
  config: ActionInput,
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();

    const source =
      config && typeof FormData !== 'undefined' && config instanceof FormData
        ? readConfigFromForm(config)
        : (config as Record<string, Record<string, string>> | null | undefined);

    if (!source || typeof source !== 'object') return { success: false, error: 'Configuração inválida.' };

    let changed = 0;
    for (const [section, values] of Object.entries(source)) {
      if (!values || typeof values !== 'object') continue;
      changed += await persistSection(ctx.user.id, String(section).slice(0, 40), values as Record<string, string>);
    }

    auditLog({
      userId: ctx.user.id,
      action: 'siteconfig.update',
      entity: 'SiteConfig',
      details: `${changed} chaves`,
    });
    revalidateConfig();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao salvar configurações.');
  }
}

// ─── NAVEGAÇÃO ──────────────────────────────────────────────

export async function createNavigationItem(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const navigationType = str(f.navigationType, 30) || 'main';
    const label = str(f.label, 120);
    const url = safeUrl(str(f.url, 500));
    if (label.length < 2) return { success: false, error: 'Informe o rótulo.' };
    if (!url) return { success: false, error: 'URL inválida. Use "/" ou http(s).' };

    const count = await prisma.navigationItem.count({ where: { navigationType } });
    const item = await prisma.navigationItem.create({
      data: {
        navigationType,
        label,
        labelEn: strOrNull(f.labelEn, 120),
        labelEs: strOrNull(f.labelEs, 120),
        url,
        icon: strOrNull(f.icon, 60),
        parentId: strOrNull(f.parentId, 64),
        sortOrder: toInt(f.sortOrder, { min: 0, max: 9999, fallback: count }),
        isActive: toBool(f.isActive, true),
      },
      select: NAV_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'nav.create', entity: 'NavigationItem', entityId: item.id });
    revalidateConfig();
    return ok(item);
  } catch (error) {
    return fail(error, 'Erro ao criar item de navegação.');
  }
}

export async function updateNavigationItem(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    const label = str(f.label, 120);
    if (label.length >= 2) data.label = label;
    if (f.labelEn !== undefined) data.labelEn = strOrNull(f.labelEn, 120);
    if (f.labelEs !== undefined) data.labelEs = strOrNull(f.labelEs, 120);
    if (f.url !== undefined) {
      const url = safeUrl(str(f.url, 500));
      if (!url) return { success: false, error: 'URL inválida. Use "/" ou http(s).' };
      data.url = url;
    }
    if (f.icon !== undefined) data.icon = strOrNull(f.icon, 60);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.isActive !== undefined) data.isActive = toBool(f.isActive, true);
    if (f.navigationType !== undefined) data.navigationType = str(f.navigationType, 30) || 'main';
    if (f.parentId !== undefined) data.parentId = strOrNull(f.parentId, 64);

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const item = await prisma.navigationItem.update({ where: { id }, data, select: NAV_SELECT });
    auditLog({ userId: ctx.user.id, action: 'nav.update', entity: 'NavigationItem', entityId: id });
    revalidateConfig();
    return ok(item);
  } catch (error) {
    return fail(error, 'Erro ao atualizar item de navegação.');
  }
}

export async function deleteNavigationItem(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.navigationItem.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'nav.delete', entity: 'NavigationItem', entityId: id });
    revalidateConfig();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir item de navegação.');
  }
}

export async function reorderNavigationItems(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    const list = Array.isArray(items) ? items.slice(0, 300) : [];
    if (list.length === 0) return { success: false, error: 'Nada para reordenar.' };

    await prisma.$transaction(
      list.map((item) =>
        prisma.navigationItem.update({
          where: { id: String(item.id).slice(0, 64) },
          data: { sortOrder: Math.max(0, Math.min(9999, Math.round(Number(item.sortOrder) || 0))) },
        }),
      ),
    );

    auditLog({ userId: ctx.user.id, action: 'nav.reorder', entity: 'NavigationItem', details: `${list.length} itens` });
    revalidateConfig();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao reordenar navegação.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

/** Aplica `value` em `key` mapeado ou nos candidatos (chave legada `snake_case`). */
function applyText(
  target: Record<string, string>,
  dbKey: string,
  value: string,
  ...candidates: string[]
): void {
  const camel = toCamel(dbKey);
  if (candidates.includes(camel) && value) target[camel] = value;
  else if (candidates.includes(dbKey) && value) target[dbKey] = value;
}

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function readConfigFromForm(form: FormData): Record<string, Record<string, string>> {
  const raw = String(form.get('config') ?? '');
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Upsert transacional de uma seção. Devolve quantas chaves mudaram. */
async function persistSection(
  actorId: string,
  section: string,
  values: Record<string, string>,
): Promise<number> {
  const entries = Object.entries(values).slice(0, MAX_KEYS_PER_SECTION);
  if (entries.length === 0) return 0;

  await prisma.$transaction(
    entries.map(([rawKey, rawValue]) => {
      const configKey = String(rawKey).replace(/[^\w.-]/g, '').slice(0, 60);
      const value = String(rawValue ?? '').replace(/\0/g, '').slice(0, MAX_VALUE_LEN);
      return prisma.siteConfig.upsert({
        where: { section_configKey: { section, configKey } },
        update: { value },
        create: { section, configKey, value },
      });
    }),
  );

  auditLog({ userId: actorId, action: 'siteconfig.section_save', entity: 'SiteConfig', details: `${section}` });
  return entries.length;
}