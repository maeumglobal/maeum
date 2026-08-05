'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── BLOG ────────────────────────────────────────────────────
export async function getBlogPosts({
  page = 1,
  pageSize = 20,
  search = '',
  status,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) where.OR = [{ title: { contains: search } }, { author: { contains: search } }];

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return { success: true, data: posts, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getBlogPosts error:', error);
    return { success: false, error: 'Erro ao buscar artigos.' };
  }
}

export async function createBlogPost(data: {
  title: string;
  author?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: string;
}) {
  try {
    const slug = data.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: data.title,
        author: data.author || 'Maeum Editor',
        excerpt: data.excerpt,
        content: data.content || '',
        coverImage: data.coverImage,
        tags: JSON.stringify([]),
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: post };
  } catch (error) {
    console.error('createBlogPost error:', error);
    return { success: false, error: 'Erro ao criar artigo.' };
  }
}

export async function updateBlogPost(id: string, data: Partial<{
  title: string;
  author: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: string;
}>) {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'published') updateData.publishedAt = new Date();
    else if (data.status === 'draft') updateData.publishedAt = null;

    const post = await prisma.blogPost.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/admin');
    return { success: true, data: post };
  } catch (error) {
    console.error('updateBlogPost error:', error);
    return { success: false, error: 'Erro ao atualizar artigo.' };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteBlogPost error:', error);
    return { success: false, error: 'Erro ao excluir artigo.' };
  }
}

// ─── DEPOIMENTOS ────────────────────────────────────────────
export async function getTestimonials({ status }: { status?: string } = {}) {
  try {
    const where = status ? { status } : {};
    const data = await prisma.testimonial.findMany({ where, orderBy: { sortOrder: 'asc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar depoimentos.' };
  }
}

export async function createTestimonial(data: {
  name: string;
  destination?: string;
  text: string;
  rating?: number;
  avatarUrl?: string;
}) {
  try {
    const count = await prisma.testimonial.count();
    const testimonial = await prisma.testimonial.create({
      data: {
        name: data.name,
        destination: data.destination,
        text: data.text,
        rating: data.rating || 5,
        avatarUrl: data.avatarUrl,
        status: 'pending',
        sortOrder: count,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: testimonial };
  } catch (error) {
    return { success: false, error: 'Erro ao criar depoimento.' };
  }
}

export async function approveTestimonial(id: string) {
  try {
    const t = await prisma.testimonial.update({ where: { id }, data: { status: 'approved' } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: t };
  } catch (error) {
    return { success: false, error: 'Erro ao aprovar depoimento.' };
  }
}

export async function rejectTestimonial(id: string) {
  try {
    const t = await prisma.testimonial.update({ where: { id }, data: { status: 'rejected' } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: t };
  } catch (error) {
    return { success: false, error: 'Erro ao rejeitar depoimento.' };
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir depoimento.' };
  }
}

// ─── FAQ ─────────────────────────────────────────────────────
export async function getFaqItems({ category }: { category?: string } = {}) {
  try {
    const where = category ? { category } : {};
    const data = await prisma.faqItem.findMany({ where, orderBy: { sortOrder: 'asc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar FAQ.' };
  }
}

export async function createFaqItem(data: { question: string; answer: string; category?: string; sortOrder?: number }) {
  try {
    const count = await prisma.faqItem.count();
    const item = await prisma.faqItem.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || 'Geral',
        sortOrder: data.sortOrder ?? count,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Erro ao criar FAQ.' };
  }
}

export async function updateFaqItem(id: string, data: Partial<{ question: string; answer: string; category: string; sortOrder: number; isActive: boolean }>) {
  try {
    const item = await prisma.faqItem.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar FAQ.' };
  }
}

export async function deleteFaqItem(id: string) {
  try {
    await prisma.faqItem.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir FAQ.' };
  }
}

// ─── CMS PAGES ───────────────────────────────────────────────
export async function getCmsPages() {
  try {
    const data = await prisma.cmsPage.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar páginas.' };
  }
}

export async function createCmsPage(data: { title: string; slug: string; content?: string; status?: string }) {
  try {
    const page = await prisma.cmsPage.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content || '',
        status: data.status || 'draft',
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: page };
  } catch (error) {
    return { success: false, error: 'Erro ao criar página.' };
  }
}

export async function updateCmsPage(id: string, data: Partial<{ title: string; content: string; status: string }>) {
  try {
    const page = await prisma.cmsPage.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: page };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar página.' };
  }
}

export async function deleteCmsPage(id: string) {
  try {
    await prisma.cmsPage.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir página.' };
  }
}

// ─── CMS BLOCKS ──────────────────────────────────────────────
export async function getCmsBlocks(pageName = 'home') {
  try {
    const data = await prisma.cmsBlock.findMany({
      where: { pageName },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar blocos CMS.' };
  }
}

export async function updateCmsBlock(id: string, data: { isActive?: boolean; sortOrder?: number; content?: Record<string, unknown> }) {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.content) updateData.content = JSON.stringify(data.content);

    const block = await prisma.cmsBlock.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/admin');
    return { success: true, data: block };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar bloco CMS.' };
  }
}

export async function reorderCmsBlocks(blocks: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(blocks.map(b => prisma.cmsBlock.update({ where: { id: b.id }, data: { sortOrder: b.sortOrder } })));
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao reordenar blocos.' };
  }
}
