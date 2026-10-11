import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, localizedPathname, type Locale } from '@/lib/seo';

export interface BreadcrumbItem {
  name: string;
  /** Path interno canônico (pt, sem prefixo): '/coreia-do-sul/experiencias'. */
  path: string;
}

/**
 * Breadcrumb visual + `BreadcrumbList` JSON-LD.
 *
 * Server Component. Passe a trilha JÁ LOCALIZADA pelo chamador (`locale`),
 * mantendo os mesmos `path` canônicos — o JSON-LD gera os `item` localizados.
 *
 * O primeiro item é automaticamente a home.
 */
export default function Breadcrumbs({
  items,
  locale = 'pt',
  className,
  showJsonLd = true,
}: {
  items: BreadcrumbItem[];
  locale?: Locale;
  className?: string;
  showJsonLd?: boolean;
}) {
  const trail = items.filter((item) => item && item.name);
  if (trail.length === 0) return null;

  const jsonLdItems = [{ name: 'Home', path: '/' }, ...trail];

  return (
    <>
      {showJsonLd ? <JsonLd id="breadcrumb-jsonld" data={breadcrumbJsonLd(jsonLdItems, locale)} /> : null}
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <Link href={localizedPathname('/', locale)} className="hover:text-accent transition-colors">
              Home
            </Link>
          </li>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={`${item.path}-${index}`} className="flex items-center gap-1">
                <ChevronRight aria-hidden className="h-3 w-3 shrink-0 opacity-60" />
                {isLast ? (
                  <span aria-current="page" className="text-foreground/80">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={localizedPathname(item.path, locale)}
                    className="hover:text-accent transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
