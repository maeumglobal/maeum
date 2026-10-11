import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import { buildMetadata, siteUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('journal.seo.title'), 60),
    description: t('journal.seo.description'),
    path: '/journal',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('journal.maeum-journal'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página — lista dos `BlogPost` publicados
 * ────────────────────────────────────────────────────────────────────────── */

export default async function JournalPage() {
  const { t, lp, htmlLang, formatDate, fill, localizedField } = await getServerI18n();

  const [posts, media] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 24,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        titleEs: true,
        excerpt: true,
        excerptEn: true,
        excerptEs: true,
        coverImage: true,
        author: true,
        tags: true,
        readingMinutes: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const slotCycle = [media.journal_post_1, media.journal_post_2, media.journal_post_3, media.journal_post_4];
  const imageFor = (index: number): string | undefined => slotCycle[index % slotCycle.length];

  const normalized = posts.map((post) => ({
    ...post,
    title: localizedField({ pt: post.title, en: post.titleEn, es: post.titleEs }) ?? post.title,
    excerpt:
      localizedField({ pt: post.excerpt, en: post.excerptEn, es: post.excerptEs }) ??
      truncateMeta(post.title, 180),
    tags: parseStringArray(post.tags),
    url: lp(`/journal/${post.slug}`),
  }));

  const [featured, ...rest] = normalized;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('journal.maeum-journal'),
    description: t('journal.description'),
    url: siteUrl(lp('/journal')),
    inLanguage: htmlLang,
    hasPart: normalized.map((post, index) => ({
      '@type': 'BlogPosting',
      position: index + 1,
      name: post.title,
      url: siteUrl(post.url),
      ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="journal-collection-jsonld" data={collectionJsonLd} />

      <Header />

      <main className="flex-1">
        <div className="px-4 md:px-8 max-w-7xl mx-auto w-full pt-14 pb-10">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            {t('journal.maeum-journal')}
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">
            {t('journal.kicker')}
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            {t('journal.description')}
          </p>
        </div>

        <div className="px-4 md:px-8 max-w-7xl mx-auto w-full pb-24">
          {normalized.length === 0 ? (
            <div className="text-center border border-border/80 rounded-3xl bg-card py-20 px-6">
              <h2 className="font-heading text-2xl font-light text-secondary">
                {t('journal.list.emptyTitle')}
              </h2>
              <p className="text-xs text-muted-foreground mt-3">
                {t('journal.list.emptyDescription')}
              </p>
            </div>
          ) : (
            <>
              {/* DESTAQUE — primeiro publicado (mais recente) */}
              {featured ? (
                <article className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card mb-10">
                  <div className="relative aspect-[21/9] w-full overflow-hidden">
                    <SmartImage
                      src={featured.coverImage}
                      alt={fill(t('journal.detail.imageAlt'), { title: featured.title })}
                      fill
                      sizes="(min-width: 1280px) 1216px, 100vw"
                      priority
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackSrc={imageFor(0) ?? media.journal_cover_fallback}
                      placeholderLabel={featured.title}
                    />
                    <span className="absolute top-5 left-5 bg-primary text-white text-[9px] font-bold tracking-widest px-3 py-1 rounded uppercase">
                      {t('journal.list.featured')}
                    </span>
                  </div>
                  <div className="p-6 md:p-10 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                      {featured.publishedAt ? (
                        <span className="flex items-center gap-1.5">
                          <Clock aria-hidden className="h-3.5 w-3.5 text-accent" />
                          {formatDate(featured.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      ) : null}
                      {featured.publishedAt && featured.readingMinutes > 0 ? <span aria-hidden>•</span> : null}
                      {featured.readingMinutes > 0 ? (
                        <span>{fill(t('journal.detail.readingTime'), { n: featured.readingMinutes })}</span>
                      ) : null}
                      <span aria-hidden>•</span>
                      <span>
                        {t('journal.por')} {featured.author}
                      </span>
                    </div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-medium text-secondary leading-snug">
                      <Link href={featured.url} className="hover:text-primary transition-colors">
                        {featured.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                      {featured.excerpt}
                    </p>
                    <Link
                      href={featured.url}
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-accent-hover transition-colors w-fit"
                    >
                      {t('journal.ler-artigo-completo')}
                      <ArrowRight aria-hidden className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ) : null}

              {rest.length > 0 ? (
                <>
                  <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-6">
                    {t('journal.list.allPosts')}
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {rest.map((post, index) => (
                      <li
                        key={post.id}
                        className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                      >
                        <Link href={post.url} className="relative aspect-[16/10] w-full overflow-hidden block">
                          <SmartImage
                            src={post.coverImage}
                            alt={fill(t('journal.detail.imageAlt'), { title: post.title })}
                            fill
                            sizes="(min-width: 768px) 33vw, 100vw"
                            quality={75}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            fallbackSrc={imageFor(index + 1) ?? media.journal_cover_fallback}
                            placeholderLabel={post.title}
                          />
                          {post.tags[0] ? (
                            <span className="absolute top-4 left-4 bg-primary text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                              {post.tags[0]}
                            </span>
                          ) : null}
                        </Link>
                        <div className="p-6 flex flex-col gap-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                            {post.publishedAt ? (
                              <>
                                <span>{formatDate(post.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span aria-hidden>•</span>
                              </>
                            ) : null}
                            <span>
                              {t('journal.por')} {post.author}
                            </span>
                          </div>
                          <h3 className="font-heading text-xl font-medium text-secondary leading-snug">
                            <Link href={post.url} className="hover:text-primary transition-colors">
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                          {post.tags.length > 0 ? (
                            <ul className="flex flex-wrap gap-2 pt-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <li
                                  key={tag}
                                  className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground border border-border/80 rounded-full px-2.5 py-1"
                                >
                                  <Tag aria-hidden className="h-2.5 w-2.5" />
                                  {tag}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <Link
                            href={post.url}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors w-fit"
                          >
                            {t('journal.ler-artigo-completo')}
                            <ArrowRight aria-hidden className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}