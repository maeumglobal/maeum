'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── EXPERIÊNCIAS ───────────────────────────────────────────
export async function getExperiences({
  page = 1,
  pageSize = 20,
  search = '',
  status,
  bookingType,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  bookingType?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (bookingType) where.bookingType = bookingType;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: { categories: { include: { category: true } } },
      }),
      prisma.experience.count({ where }),
    ]);

    return { success: true, data: experiences, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getExperiences error:', error);
    return { success: false, error: 'Erro ao buscar experiências.' };
  }
}

export async function createExperience(data: {
  slug: string;
  title: string;
  subtitle?: string;
  location?: string;
  description?: string;
  highlights?: string[];
  included?: string[];
  durationHours?: number;
  pricePerPerson: number;
  mainImage?: string;
  bookingType?: string;
  categoryIds?: string[];
}) {
  try {
    const experience = await prisma.experience.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        location: data.location || 'Seul',
        description: data.description,
        highlights: JSON.stringify(data.highlights || []),
        included: JSON.stringify(data.included || []),
        durationHours: data.durationHours || 2,
        pricePerPerson: data.pricePerPerson,
        mainImage: data.mainImage,
        gallery: JSON.stringify([]),
        status: 'active',
        bookingType: data.bookingType || 'direct',
        availableFrom: new Date(),
        categories: data.categoryIds?.length ? {
          create: data.categoryIds.map(categoryId => ({ categoryId })),
        } : undefined,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: experience };
  } catch (error) {
    console.error('createExperience error:', error);
    return { success: false, error: 'Erro ao criar experiência.' };
  }
}

export async function updateExperience(id: string, data: Partial<{
  title: string;
  subtitle: string;
  location: string;
  description: string;
  highlights: string[];
  included: string[];
  durationHours: number;
  pricePerPerson: number;
  mainImage: string;
  status: string;
  bookingType: string;
}>) {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.highlights) updateData.highlights = JSON.stringify(data.highlights);
    if (data.included) updateData.included = JSON.stringify(data.included);

    const experience = await prisma.experience.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/admin');
    return { success: true, data: experience };
  } catch (error) {
    console.error('updateExperience error:', error);
    return { success: false, error: 'Erro ao atualizar experiência.' };
  }
}

export async function deleteExperience(id: string) {
  try {
    await prisma.experience.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteExperience error:', error);
    return { success: false, error: 'Erro ao excluir experiência.' };
  }
}

// ─── K-BEAUTY ───────────────────────────────────────────────
export async function getKbeautyExperiences() {
  try {
    const data = await prisma.kbeautyExperience.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar experiências K-Beauty.' };
  }
}

export async function createKbeautyExperience(data: {
  slug: string;
  title: string;
  subtitle?: string;
  location?: string;
  description?: string;
  pricePerPerson: number;
  durationHours?: number;
  mainImage?: string;
  bookingType?: string;
}) {
  try {
    const exp = await prisma.kbeautyExperience.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        location: data.location || 'Seul',
        description: data.description,
        highlights: JSON.stringify([]),
        included: JSON.stringify([]),
        durationHours: data.durationHours || 2,
        pricePerPerson: data.pricePerPerson,
        mainImage: data.mainImage,
        gallery: JSON.stringify([]),
        status: 'active',
        bookingType: data.bookingType || 'request',
        availableFrom: new Date(),
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: exp };
  } catch (error) {
    return { success: false, error: 'Erro ao criar experiência K-Beauty.' };
  }
}

export async function deleteKbeautyExperience(id: string) {
  try {
    await prisma.kbeautyExperience.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir experiência K-Beauty.' };
  }
}

// ─── CATEGORIAS ─────────────────────────────────────────────
export async function getCategories() {
  try {
    const data = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar categorias.' };
  }
}

export async function createCategory(data: { slug: string; name: string; destination?: string }) {
  try {
    const count = await prisma.category.count();
    const category = await prisma.category.create({
      data: { slug: data.slug, name: data.name, destination: data.destination || 'Coreia do Sul', sortOrder: count },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: 'Erro ao criar categoria.' };
  }
}

export async function updateCategory(id: string, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
  try {
    const category = await prisma.category.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar categoria.' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir categoria.' };
  }
}
