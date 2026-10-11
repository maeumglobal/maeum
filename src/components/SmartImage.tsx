import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
 * Allowlist de imagens (espelha `images.remotePatterns` do next.config.ts).
 *
 * `next/image` LANÇA em render quando o host não está na allowlist, o que
 * derrubava a página inteira (500) por causa de uma URL colada no admin.
 * ────────────────────────────────────────────────────────────────────────── */

const REMOTE_ALLOWLIST: readonly string[] = [
  'images.unsplash.com',
  'images.maeumglobal.com.br',
  'maeumglobal.com.br',
  'www.maeumglobal.com.br',
];

/** Sufixos que casam com `*.supabase.co` (o domínio real varia por projeto). */
const REMOTE_ALLOWLIST_SUFFIXES: readonly string[] = ['.supabase.co'];

/** Coincide com `hostname` ou com subdomínios (`.supabase.co`). */
function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (REMOTE_ALLOWLIST.includes(host)) return true;
  return REMOTE_ALLOWLIST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function isLocalPath(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//');
}

function isAllowedRemote(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return hostAllowed(url.hostname);
  } catch {
    return false;
  }
}

/** `true` quando `next/image` pode ser usado com segurança. */
export function canUseNextImage(src: unknown): boolean {
  if (typeof src !== 'string') return false;
  const value = src.trim();
  if (!value) return false;
  if (isLocalPath(value)) return true;
  return isAllowedRemote(value);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Tipos
 * ────────────────────────────────────────────────────────────────────────── */

export interface SmartImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'width' | 'height' | 'loading' | 'onLoad' | 'onError' | 'sizes' | 'style'
  > {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  /** Preenche o container pai (exige `position: relative` no pai). */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  preload?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
  style?: CSSProperties;
  quality?: number;
  /** Desliga a otimização (útil para `/api/media/*`, já servido em cache). */
  unoptimizedMedia?: boolean;
  /** Caminho/URL usado quando `src` é vazio ou inválido. */
  fallbackSrc?: string;
  /** Rótulo acessível do placeholder neutro (sem `fallbackSrc`). */
  placeholderLabel?: string;
  /**
   * ⚠️ Handler nativo de `<img>`. Só funciona se o CONSUMIDOR for um Client
   * Component — funções não são serializáveis de Server → Client.
   */
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  /** ⚠️ Ver `onLoad`. */
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

const PLACEHOLDER_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, rgba(74,31,45,0.4) 0%, rgba(26,15,20,0.4) 50%, rgba(200,162,124,0.28) 100%)',
};

function renderPlaceholder(alt: string, className?: string, style?: CSSProperties): ReactNode {
  return (
    <div
      role={alt ? 'img' : 'presentation'}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      data-smart-image-placeholder=""
      className={className}
      style={{ ...PLACEHOLDER_STYLE, ...style }}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * SmartImage — Server Component (SEM 'use client', sem hooks)
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * `<Image>` tolerante a falha.
 *
 * - `src` local (`/images/...`, `/api/media/<id>`) ou host na allowlist →
 *   `next/image` (otimização, AVIF/WebP, `sizes`, LCP prioritário).
 * - `src` remoto FORA da allowlist → `<img loading="lazy" decoding="async">`,
 *   para nunca lançar em render nem expor um proxy aberto.
 * - `src` vazio/inválido → `fallbackSrc` ou placeholder neutro.
 *
 * ## Por que não existe `SmartImageClient` neste arquivo
 *
 * Um módulo é OU Server Component OU Client Component — o `'use client'` é por
 * ARQUIVO, não por export. Marcar este arquivo tornaria `SmartImage` client e
 * quebraria o uso em Server Components (que é o caso principal: o CMS
 * renderiza a maior parte das páginas no servidor).
 *
 * ## Restrição sobre `onLoad` / `onError`
 *
 * Este componente não usa estado, então funciona em Server Components. Mas
 * handlers de DOM exigem Client Component: se você precisa de `onError`, use-o
 * a partir de um Client Component (o handler será repassado direto ao `<img>`).
 * Para lógica de erro com estado ( skeleton → retry ), crie
 * `src/components/SmartImage.client.tsx` com `'use client'` e reexporte aqui.
 */
export default function SmartImage({
  src,
  alt = '',
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  preload,
  loading,
  className,
  style,
  quality,
  unoptimizedMedia = false,
  fallbackSrc,
  placeholderLabel,
  onLoad,
  onError,
  ...rest
}: SmartImageProps) {
  const raw = typeof src === 'string' ? src.trim() : '';
  const candidate = raw || (typeof fallbackSrc === 'string' ? fallbackSrc.trim() : '');

  if (!candidate) {
    return renderPlaceholder(alt || placeholderLabel || '', className, style);
  }

  const eager = priority === true || loading === 'eager';

  if (!canUseNextImage(candidate)) {
    // Fora da allowlist: <img> puro. Nunca lança, nunca passa pelo otimizador.
    return (
      // eslint-disable-next-line @next/next/no-img-element -- host fora da allowlist do next.config.ts
      <img
        {...rest}
        src={candidate}
        alt={alt}
        {...(fill ? {} : { width, height })}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={className}
        style={style}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <Image
      {...rest}
      src={candidate}
      alt={alt}
      fill={fill}
      priority={priority}
      {...(preload !== undefined ? { preload } : {})}
      {...(sizes !== undefined ? { sizes } : {})}
      className={className}
      style={style}
      unoptimized={unoptimizedMedia}
      {...(quality !== undefined ? { quality } : {})}
      {...(fill ? {} : { width: width ?? 1200, height: height ?? 800 })}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
