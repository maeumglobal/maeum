import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale, isLocale } from './i18n/config';

// Paths that must never be locale-prefixed/redirected (dashboards, admin, auth, API, static).
const SKIP_PREFIXES = [
  '/dashboard',
  '/admin',
  '/admin-conversas',
  '/login',
  '/api',
  '/_next',
  '/images',
  '/favicon',
];

// Generic file extensions that must not be redirected.
const FILE_EXT = /\.(png|jpg|jpeg|webp|gif|svg|ico|xml|txt|json|webmanifest|woff2?|css|js|map)$/i;

/** Detect preferred locale from cookie or Accept-Language header. */
function getPreferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get('maeum_locale')?.value;
  if (cookie && isLocale(cookie)) return cookie;

  const accept = request.headers.get('accept-language') || '';
  const langs = accept
    .split(',')
    .map((s) => s.trim().split(';')[0].trim().replace(/[-_].*$/, ''));

  for (const code of langs) {
    for (const l of locales) {
      if (code.toLowerCase() === l) return l;
    }
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Don't touch prefixed locale routes — but pass the locale downstream via a header
  // so the server layout can set <html lang> and localized metadata.
  const prefixMatch = pathname.match(/^\/(pt|en|es)(?:\/|$)/);
  if (prefixMatch && isLocale(prefixMatch[1])) {
    const pathWithoutPrefix = pathname === `/${prefixMatch[1]}` ? '/' : pathname.slice(prefixMatch[1].length + 1);
    const url = new URL(pathWithoutPrefix + search, request.url);
    const response = NextResponse.rewrite(url);
    response.headers.set('x-maeum-locale', prefixMatch[1]);
    return response;
  }

  // Don't redirect internal / asset paths.
  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  if (pathname === '/' || FILE_EXT.test(pathname)) {
    return NextResponse.next();
  }

  // Any other public path (e.g. /destinos) is canonical Portuguese.
  const response = NextResponse.next();
  response.headers.set('x-maeum-locale', defaultLocale);
  return response;
}

export const config = {
  matcher: ['/:path*'],
};