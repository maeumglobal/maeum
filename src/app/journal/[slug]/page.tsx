import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Tag, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import { sanitizeHtml, SanitizedHtml } from '@/lib/sanitizeHtml';
import { articleJsonLd, buildMetadata, truncateMeta } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const POST_SELECT = {
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
  readingMinutes: true,
  seoTitle: true,
  seoDesc: true,
  publishedAt: true,
  updatedAt: true,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true },
      orderBy: { publishedAt: 'desc' },
      take: 300,
    });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t, localizedField } = await getServerI18n();

  const post = await prisma.blogPost
    .findFirst({ where: { slug, status: 'published' }, select: POST_SELECT })
    .catch(() => null);

  if (!post) {
    return buildMetadata({
      title: truncateMeta(`${t('journal.maeum-journal')} | Maeum Global`, 60),
      description: '',
      path: `/journal/${slug}`,
      locale,
      noindex: true,
    });
  }

  const title = localizedField({ pt: post.title, en: post.titleEn, es: post.titleEs }) ?? post.title;
  const excerpt = localizedField({ pt: post.excerpt, en: post.excerptEn, es: post.excerptEs }) ?? '';

  return buildMetadata({
    // `seoTitle`/`seoDesc` do painel têm prioridade; sempre truncados.
    title: truncateMeta(post.seoTitle, 60) || truncateMeta(title, 60),
    description:
      truncateMeta(post.seoDesc, 160) ||
      truncateMeta(excerpt, 160) ||
      truncateMeta(title, 160),
    path: `/journal/${post.slug}`,
    locale,
    image: post.coverImage ?? undefined,
    imageAlt: title,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function JournalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { t, locale, lp, formatDate, fill, localizedField } = await getServerI18n();

  const [post, media] = await Promise.all([
    prisma.blogPost.findFirst({ where: { slug, status: 'published' }, select: POST_SELECT }).catch(() => null),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  if (!post) notFound();

  const title = localizedField({ pt: post.title, en: post.titleEn, es: post.titleEs }) ?? post.title;
  const excerpt = localizedField({ pt: post.excerpt, en: post.excerptEn, es: post.excerptEs });
  const tags = parseStringArray(post.tags);

  /**
   * O `content` é HTML digitado no painel. Passa por `sanitizeHtml` (que remove
   * `<script>`, `<iframe>` fora da allowlist, `on*` e `javascript:`) ANTES de
   * chegar ao DOM, e a renderização fica confinada ao componente
   * `SanitizedHtml` de `src/lib/sanitizeHtml.ts` — nenhum outro lugar do
   * projeto injeta HTML do banco.
   */
  const safeBody = sanitizeHtml(post.content);
  const wordCount = safeBody ? safeBody.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0;

  const related = await prisma.blogPost.findMany({
    where: { status: 'published', slug: { not: post.slug } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      titleEs: true,
      excerpt: true,
      publishedAt: true,
      coverImage: true,
    },
  });

  const articleSchema = articleJsonLd({
    headline: title,
    description: excerpt ?? title,
    path: `/journal/${post.slug}`,
    locale,
    image: post.coverImage ?? media.journal_cover_fallback,
    authorName: post.author,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: tags,
    wordCount,
    section: t('journal.maeum-journal'),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="journal-article-jsonld" data={articleSchema} />

      <Header />

      <main className="flex-1 w-full">
        {/* Capa (LCP) */}
        <div className="relative w-full aspect-[21/9] max-h-[520px] overflow-hidden bg-muted">
          <SmartImage
            src={post.coverImage}
            alt={fill(t('journal.detail.imageAlt'), { title })}
            fill
            sizes="100vw"
            priority
            quality={90}
            className="object-cover"
            fallbackSrc={media.journal_post_1 ?? media.journal_cover_fallback}
            placeholderLabel={title}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('journal.maeum-journal'), path: '/journal' },
              { name: title, path: `/journal/${post.slug}` },
            ]}
          />

          <Link
            href={lp('/journal')}
            className="inline-flex items-center gap-2 mt-6 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('journal.detail.backToJournal')}
          </Link>

          <article className="mt-6">
            <header>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light text-secondary leading-tight">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-[11px] text-muted-foreground font-semibold">
                {post.publishedAt ? (
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden className="h-3.5 w-3.5 text-accent" />
                    <time dateTime={post.publishedAt.toISOString()}>
                      {fill(t('journal.detail.publishedOn'), {
                        date: formatDate(post.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' }),
                      })}
                    </time>
                  </span>
                ) : null}
                {post.readingMinutes > 0 ? (
                  <span>{fill(t('journal.detail.readingTime'), { n: post.readingMinutes })}</span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <User aria-hidden className="h-3.5 w-3.5 text-accent" />
                  {t('journal.por')} {post.author}
                </span>
              </div>

              {excerpt ? (
                <p className="text-base text-muted-foreground leading-relaxed mt-6 border-l-2 border-primary/40 pl-5">
                  {excerpt}
                </p>
              ) : null}
            </header>

            {safeBody ? (
              <SanitizedHtml
                html={post.content}
                className="mt-10 text-[15px] leading-relaxed text-foreground/90 space-y-4 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:text-secondary [&_h2]:mt-10 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:text-secondary [&_h3]:mt-8 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:rounded-2xl [&_img]:rounded-2xl [&_img]:my-6 [&_li]:ml-5 [&_li]:list-disc [&_ol]:list-decimal [&_strong]:text-secondary [&_table]:w-full [&_table]:my-6 [&_td]:border [&_td]:border-border [&_td]:p-3 [&_th]:border [&_th]:border-border [&_th]:p-3 [&_ul]:my-4"
              />
            ) : (
              <p className="mt-10 text-sm text-muted-foreground italic">{t('journal.detail.bodyMissing')}</p>
            )}

            <footer className="mt-12 pt-8 border-t border-border/80">
              <p className="text-[11px] text-muted-foreground flex flex-col gap-1">
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt.toISOString()}>
                    {fill(t('journal.detail.publishedOn'), {
                      date: formatDate(post.publishedAt, { dateStyle: 'long' }),
                    })}
                  </time>
                ) : null}
                <time dateTime={post.updatedAt.toISOString()}>
                  {fill(t('journal.detail.updatedOn'), {
                    date: formatDate(post.updatedAt, { dateStyle: 'long' }),
                  })}
                </time>
              </p>

              {tags.length > 0 ? (
                <>
                  <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-6 mb-3">
                    {t('journal.detail.tags')}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-border/80 rounded-full px-3 py-1.5"
                      >
                        <Tag aria-hidden className="h-3 w-3" />
                        {tag}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </footer>
          </article>
        </div>

        {related.length > 0 ? (
          <section
            aria-labelledby="journal-relacionados"
            className="max-w-7xl mx-auto px-4 md:px-8 w-full py-20 mt-10"
          >
            <h2
              id="journal-relacionados"
              className="text-xs uppercase tracking-widest text-primary font-bold mb-8"
            >
              {t('journal.detail.relatedTitle')}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((item) => {
                const relatedTitle =
                  localizedField({ pt: item.title, en: item.titleEn, es: item.titleEs }) ?? item.title;
                return (
                  <li
                    key={item.id}
                    className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    <Link
                      href={lp(`/journal/${item.slug}`)}
                      className="relative aspect-[16/10] w-full overflow-hidden block"
                    >
                      <SmartImage
                        src={item.coverImage}
                        alt={fill(t('journal.detail.imageAlt'), { title: relatedTitle })}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        quality={75}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        fallbackSrc={media.journal_cover_fallback}
                        placeholderLabel={relatedTitle}
                      />
                    </Link>
                    <div className="p-6 flex flex-col gap-3">
                      {item.publishedAt ? (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {formatDate(item.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      ) : null}
                      <h3 className="font-heading text-lg font-medium text-secondary leading-snug">
                        <Link href={lp(`/journal/${item.slug}`)} className="hover:text-primary transition-colors">
                          {relatedTitle}
                        </Link>
                      </h3>
                      {item.excerpt ? (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {item.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}