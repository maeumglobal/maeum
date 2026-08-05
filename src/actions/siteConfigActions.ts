'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── SITE CONFIG ─────────────────────────────────────────────
export async function getSiteConfig() {
  try {
    const configs = await prisma.siteConfig.findMany({ orderBy: { section: 'asc' } });
    // Transform flat records into nested object
    const result: Record<string, Record<string, string>> = {};
    for (const c of configs) {
      if (!result[c.section]) result[c.section] = {};
      result[c.section][c.configKey] = c.value;
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('getSiteConfig error:', error);
    return { success: false, error: 'Erro ao buscar configurações.' };
  }
}

export async function updateSiteConfigSection(section: string, values: Record<string, string>) {
  try {
    const ops = Object.entries(values).map(([configKey, value]) =>
      prisma.siteConfig.upsert({
        where: { section_configKey: { section, configKey } },
        update: { value },
        create: { section, configKey, value },
      })
    );
    await Promise.all(ops);
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('updateSiteConfig error:', error);
    return { success: false, error: 'Erro ao salvar configurações.' };
  }
}

export async function updateFullSiteConfig(config: Record<string, Record<string, string>>) {
  try {
    const ops: Promise<unknown>[] = [];
    for (const [section, values] of Object.entries(config)) {
      for (const [configKey, value] of Object.entries(values)) {
        ops.push(
          prisma.siteConfig.upsert({
            where: { section_configKey: { section, configKey } },
            update: { value: String(value) },
            create: { section, configKey, value: String(value) },
          })
        );
      }
    }
    await Promise.all(ops);
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('updateFullSiteConfig error:', error);
    return { success: false, error: 'Erro ao salvar configurações.' };
  }
}

// ─── NAVEGAÇÃO ───────────────────────────────────────────────
export async function getNavigationItems(navigationType?: string) {
  try {
    const where = navigationType ? { navigationType } : {};
    const data = await prisma.navigationItem.findMany({
      where,
      orderBy: [{ navigationType: 'asc' }, { sortOrder: 'asc' }],
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar itens de navegação.' };
  }
}

export async function createNavigationItem(data: {
  navigationType: string;
  label: string;
  url: string;
  icon?: string;
  parentId?: string;
}) {
  try {
    const count = await prisma.navigationItem.count({ where: { navigationType: data.navigationType } });
    const item = await prisma.navigationItem.create({
      data: {
        navigationType: data.navigationType,
        label: data.label,
        url: data.url,
        icon: data.icon,
        parentId: data.parentId,
        sortOrder: count,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Erro ao criar item de navegação.' };
  }
}

export async function updateNavigationItem(id: string, data: Partial<{ label: string; url: string; isActive: boolean; sortOrder: number }>) {
  try {
    const item = await prisma.navigationItem.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar item de navegação.' };
  }
}

export async function deleteNavigationItem(id: string) {
  try {
    await prisma.navigationItem.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir item de navegação.' };
  }
}

export async function reorderNavigationItems(items: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(items.map(i => prisma.navigationItem.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao reordenar navegação.' };
  }
}
