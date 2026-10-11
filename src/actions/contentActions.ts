'use server';

/**
 * Conteúdo editorial: blog, depoimentos, FAQ, páginas e blocos de CMS.
 *
 * Autorização: leitura `requireStaff()`, escrita `requireAdmin()` (conteúdo é
 * do CMS). Todas as mutações gravam `auditLog` e revalidam as rotas REAIS que
 * consomem o dado (`/journal`, `/`) — `/dashboard/admin` é client component e
 * não invalida nada.
 *
 * Correções aplicadas:
 *  - `slug` do blog era `titulo + '-' + Date.now()`: toda criação gerava uma URL
 *    diferente e colidia. Agora usa `uniqueSlug(prisma.blogPost, titulo)`.
 *  - Ao editar, o slug existente é PRESERVADO (a URL pública não quebra).
 *  - `reorderCmsBlocks` rodava N updates soltos; agora é transação.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import {
  str,
  strOrNull,
  toInt,
  safeUrl,
  uniqueSlug,
  slugify,
  toJsonArray,
} from '@/lib/validate';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  ok,
  slugSource,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

const BLOG_SELECT = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  titleEs: true,
  excerpt: true,
  excerptEn: true,
  excerptEs: true,
  content: true,
  author: true,
  coverImage: true,
  tags: true,
  status: true,
  readingMinutes: true,
  seoTitle: true,
  seoDesc: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const TESTIMONIAL_SELECT = {
  id: true,
  name: true,
  destination: true,
  text: true,
  rating: true,
  avatarUrl: true,
  status: true,
  sortOrder: true,
  createdAt: true,
} as const;

const FAQ_SELECT = {
  id: true,
  question: true,
  answer: true,
  category: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
} as const;

const CMS_PAGE_SELECT = {
  id: true,
  title: true,
  slug: true,
  content: true,
  seoTitle: true,
  seoDesc: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const CMS_BLOCK_SELECT = {
  id: true,
  pageName: true,
  sectionId: true,
  blockType: true,
  content: true,
  sortOrder: true,
  isActive: true,
} as const;

function revalidateContent() {
  revalidatePath('/journal');
  revalidatePath('/');
  revalidatePath('/dashboard/admin');
}

/** Remove o sufixo numérico que o painel legado acrescentava (`titulo-1759...`). */
function stripLegacyTimestamp(value: string): string {
  return value.replace(/-\d{10,}$/, '');
}

// ─── BLOG ────────────────────────────────────────────────────

export async function getBlogPosts(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const search = String(input.search ?? '').trim().slice(0, 120);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 20);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.blogPost.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: BLOG_SELECT }),
      prisma.blogPost.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar artigos.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function createBlogPost(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título do artigo.' };

    const status = str(f.status, 20) === 'published' ? 'published' : 'draft';
    const content = str(f.content, 60_000);
    const slugRequested = str(f.slug, 120);
    const slug = await uniqueSlug(
      slugSource(prisma.blogPost),
      slugRequested ? stripLegacyTimestamp(slugRequested) : title,
    );

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        titleEn: strOrNull(f.titleEn, 200),
        titleEs: strOrNull(f.titleEs, 200),
        author: str(f.author, 120) || 'Maeum Editorial',
        excerpt: strOrNull(f.excerpt, 600),
        excerptEn: strOrNull(f.excerptEn, 600),
        excerptEs: strOrNull(f.excerptEs, 600),
        content,
        coverImage: safeUrl(strOrNull(f.coverImage, 500)),
        tags: toJsonArray(f.tags, 20),
        status,
        readingMinutes: toInt(f.readingMinutes, { min: 1, max: 120, fallback: estimateMinutes(content) }),
        seoTitle: strOrNull(f.seoTitle, 200),
        seoDesc: strOrNull(f.seoDesc, 320),
        publishedAt: status === 'published' ? new Date() : null,
      },
      select: BLOG_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'blog.create', entity: 'BlogPost', entityId: post.id, details: slug });
    revalidateContent();
    return ok(post);
  } catch (error) {
    return fail(error, 'Erro ao criar artigo.');
  }
}

export async function updateBlogPost(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true },
    });
    if (!current) return { success: false, error: 'Artigo não encontrado.' };

    const data: Record<string, unknown> = {};

    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    if (f.titleEn !== undefined) data.titleEn = strOrNull(f.titleEn, 200);
    if (f.titleEs !== undefined) data.titleEs = strOrNull(f.titleEs, 200);
    if (f.author !== undefined) data.author = strOrNull(f.author, 120);
    if (f.excerpt !== undefined) data.excerpt = strOrNull(f.excerpt, 600);
    if (f.excerptEn !== undefined) data.excerptEn = strOrNull(f.excerptEn, 600);
    if (f.excerptEs !== undefined) data.excerptEs = strOrNull(f.excerptEs, 600);
    if (f.content !== undefined) data.content = str(f.content, 60_000);
    if (f.coverImage !== undefined) data.coverImage = safeUrl(strOrNull(f.coverImage, 500));
    if (f.tags !== undefined) data.tags = toJsonArray(f.tags, 20);
    if (f.seoTitle !== undefined) data.seoTitle = strOrNull(f.seoTitle, 200);
    if (f.seoDesc !== undefined) data.seoDesc = strOrNull(f.seoDesc, 320);
    if (f.readingMinutes !== undefined) {
      data.readingMinutes = toInt(f.readingMinutes, { min: 1, max: 120, fallback: 4 });
    }

    if (f.status !== undefined) {
      const status = str(f.status, 20);
      if (status !== 'published' && status !== 'draft') return { success: false, error: 'Status inválido.' };
      data.status = status;
      data.publishedAt = status === 'published' ? (current.status === 'published' ? undefined : new Date()) : null;
    }

    // Slug: preserva o existente. Só regenera se o admin mandar outro explicitamente.
    const slugRequested = str(f.slug, 120);
    if (slugRequested && slugify(slugRequested) !== current.slug) {
      data.slug = await uniqueSlug(slugSource(prisma.blogPost), stripLegacyTimestamp(slugRequested), id);
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const post = await prisma.blogPost.update({ where: { id }, data, select: BLOG_SELECT });
    auditLog({ userId: ctx.user.id, action: 'blog.update', entity: 'BlogPost', entityId: id });
    revalidateContent();
    return ok(post);
  } catch (error) {
    return fail(error, 'Erro ao atualizar artigo.');
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.blogPost.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'blog.delete', entity: 'BlogPost', entityId: id });
    revalidateContent();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir artigo.');
  }
}

// ─── DEPOIMENTOS ────────────────────────────────────────────

export async function getTestimonials(input: { status?: string } = {}): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const where = input.status ? { status: String(input.status).slice(0, 20) } : {};
    const data = await prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      select: TESTIMONIAL_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar depoimentos.');
  }
}

export async function createTestimonial(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const name = str(f.name, 120);
    const text = str(f.text, 2000);
    if (name.length < 2) return { success: false, error: 'Informe o nome.' };
    if (text.length < 10) return { success: false, error: 'O depoimento é muito curto.' };

    const count = await prisma.testimonial.count();
    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        destination: strOrNull(f.destination, 120),
        text,
        rating: toInt(f.rating, { min: 1, max: 5, fallback: 5 }),
        avatarUrl: safeUrl(strOrNull(f.avatarUrl, 500)),
        status: 'pending',
        sortOrder: count,
      },
      select: TESTIMONIAL_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'testimonial.create',
      entity: 'Testimonial',
      entityId: testimonial.id,
    });
    revalidateContent();
    return ok(testimonial);
  } catch (error) {
    return fail(error, 'Erro ao criar depoimento.');
  }
}

export async function approveTestimonial(id: string): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const t = await prisma.testimonial.update({
      where: { id },
      data: { status: 'approved' },
      select: TESTIMONIAL_SELECT,
    });
    auditLog({ userId: ctx.user.id, action: 'testimonial.approve', entity: 'Testimonial', entityId: id });
    revalidateContent();
    return ok(t);
  } catch (error) {
    return fail(error, 'Erro ao aprovar depoimento.');
  }
}

export async function rejectTestimonial(id: string): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const t = await prisma.testimonial.update({
      where: { id },
      data: { status: 'rejected' },
      select: TESTIMONIAL_SELECT,
    });
    auditLog({ userId: ctx.user.id, action: 'testimonial.reject', entity: 'Testimonial', entityId: id });
    revalidateContent();
    return ok(t);
  } catch (error) {
    return fail(error, 'Erro ao rejeitar depoimento.');
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.testimonial.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'testimonial.delete', entity: 'Testimonial', entityId: id });
    revalidateContent();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir depoimento.');
  }
}

// ─── FAQ ─────────────────────────────────────────────────────

export async function getFaqItems(input: { category?: string } = {}): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const where = input.category ? { category: String(input.category).slice(0, 80) } : {};
    const data = await prisma.faqItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      take: 300,
      select: FAQ_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar FAQ.');
  }
}

export async function createFaqItem(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const question = str(f.question, 300);
    const answer = str(f.answer, 5000);
    if (question.length < 5) return { success: false, error: 'Informe a pergunta.' };
    if (answer.length < 5) return { success: false, error: 'Informe a resposta.' };

    const count = await prisma.faqItem.count();
    const item = await prisma.faqItem.create({
      data: {
        question,
        answer,
        category: str(f.category, 80) || 'Geral',
        sortOrder: toInt(f.sortOrder, { min: 0, max: 9999, fallback: count }),
        isActive: true,
      },
      select: FAQ_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'faq.create', entity: 'FaqItem', entityId: item.id });
    revalidateContent();
    return ok(item);
  } catch (error) {
    return fail(error, 'Erro ao criar FAQ.');
  }
}

export async function updateFaqItem(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    const question = str(f.question, 300);
    if (question.length >= 5) data.question = question;
    const answer = str(f.answer, 5000);
    if (answer.length >= 5) data.answer = answer;
    if (f.category !== undefined) data.category = str(f.category, 80) || 'Geral';
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.isActive !== undefined) data.isActive = toBoolSafe(f.isActive, true);

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const item = await prisma.faqItem.update({ where: { id }, data, select: FAQ_SELECT });
    auditLog({ userId: ctx.user.id, action: 'faq.update', entity: 'FaqItem', entityId: id });
    revalidateContent();
    return ok(item);
  } catch (error) {
    return fail(error, 'Erro ao atualizar FAQ.');
  }
}

export async function deleteFaqItem(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.faqItem.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'faq.delete', entity: 'FaqItem', entityId: id });
    revalidateContent();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir FAQ.');
  }
}

// ─── CMS PAGES ───────────────────────────────────────────────

export async function getCmsPages(): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.cmsPage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: CMS_PAGE_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar páginas.');
  }
}

export async function createCmsPage(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título da página.' };
    const status = str(f.status, 20) === 'published' ? 'published' : 'draft';
    const slug = await uniqueSlug(slugSource(prisma.cmsPage), str(f.slug, 120) || title);

    const page = await prisma.cmsPage.create({
      data: {
        title,
        slug,
        content: str(f.content, 100_000),
        seoTitle: strOrNull(f.seoTitle, 200),
        seoDesc: strOrNull(f.seoDesc, 320),
        status,
      },
      select: CMS_PAGE_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'cms.page_create',
      entity: 'CmsPage',
      entityId: page.id,
      details: slug,
    });
    revalidateContent();
    return ok(page);
  } catch (error) {
    return fail(error, 'Erro ao criar página.');
  }
}

export async function updateCmsPage(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.cmsPage.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!current) return { success: false, error: 'Página não encontrada.' };

    const data: Record<string, unknown> = {};
    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    if (f.content !== undefined) data.content = str(f.content, 100_000);
    if (f.seoTitle !== undefined) data.seoTitle = strOrNull(f.seoTitle, 200);
    if (f.seoDesc !== undefined) data.seoDesc = strOrNull(f.seoDesc, 320);
    if (f.status !== undefined) {
      const status = str(f.status, 20);
      if (status !== 'published' && status !== 'draft') return { success: false, error: 'Status inválido.' };
      data.status = status;
    }

    // O slug agora é editável: preservado quando o admin não o altera e
    // garantidamente único quando altera.
    const slugRequested = str(f.slug, 140);
    if (slugRequested) {
      const nextSlug = slugify(stripLegacyTimestamp(slugRequested));
      if (nextSlug && nextSlug !== current.slug) {
        data.slug = await uniqueSlug(slugSource(prisma.cmsPage), nextSlug, id);
      }
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const page = await prisma.cmsPage.update({ where: { id }, data, select: CMS_PAGE_SELECT });
    auditLog({ userId: ctx.user.id, action: 'cms.page_update', entity: 'CmsPage', entityId: id });
    revalidateContent();
    return ok(page);
  } catch (error) {
    return fail(error, 'Erro ao atualizar página.');
  }
}

export async function deleteCmsPage(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.cmsPage.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'cms.page_delete', entity: 'CmsPage', entityId: id });
    revalidateContent();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir página.');
  }
}

// ─── CMS BLOCKS ──────────────────────────────────────────────

export async function getCmsBlocks(pageName = 'home'): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.cmsBlock.findMany({
      where: { pageName: String(pageName).slice(0, 60) },
      orderBy: { sortOrder: 'asc' },
      take: 200,
      select: CMS_BLOCK_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar blocos CMS.');
  }
}

export async function updateCmsBlock(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    if (f.isActive !== undefined) data.isActive = toBoolSafe(f.isActive, true);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.content !== undefined) data.content = safeJson(f.content);

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const block = await prisma.cmsBlock.update({ where: { id }, data, select: CMS_BLOCK_SELECT });
    auditLog({ userId: ctx.user.id, action: 'cms.block_update', entity: 'CmsBlock', entityId: id });
    revalidateContent();
    return ok(block);
  } catch (error) {
    return fail(error, 'Erro ao atualizar bloco CMS.');
  }
}

export async function reorderCmsBlocks(
  blocks: Array<{ id: string; sortOrder: number }>,
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    const list = Array.isArray(blocks) ? blocks.slice(0, 200) : [];
    if (list.length === 0) return { success: false, error: 'Nada para reordenar.' };

    await prisma.$transaction(
      list.map((b) =>
        prisma.cmsBlock.update({
          where: { id: String(b.id).slice(0, 64) },
          data: { sortOrder: Math.max(0, Math.min(9999, Math.round(Number(b.sortOrder) || 0))) },
        }),
      ),
    );

    auditLog({
      userId: ctx.user.id,
      action: 'cms.block_reorder',
      entity: 'CmsBlock',
      details: `${list.length} blocos`,
    });
    revalidateContent();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao reordenar blocos.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function estimateMinutes(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(120, Math.round(words / 200) || 1));
}

function safeJson(raw: FormDataEntryValue): string {
  const text = String(raw).trim().slice(0, 20_000);
  if (!text) return '{}';
  try {
    JSON.parse(text);
    return text;
  } catch {
    return JSON.stringify({ text });
  }
}

function toBoolSafe(value: FormDataEntryValue | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  const v = String(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
}