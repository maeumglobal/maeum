import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale, isLocale } from './i18n/config';
import { verifySession, SESSION_COOKIE, isAdmin, isStaff } from './lib/session';

/**
 * Rotas internas que nunca são prefixadas com locale.
 */
const SKIP_PREFIXES = [
  '/dashboard',
  '/admin',
  '/login',
  '/api',
  '/_next',
  '/images',
  '/favicon',
  '/manifest.webmanifest',
];

const LOCALE_HEADER = 'x-maeum-locale';

/**
 * Remove o prefixo /pt|/en|/es e devolve o caminho canônico + locale.
 */
function splitLocale(pathname: string): { path: string; locale: Locale } {
  const match = pathname.match(/^\/(pt|en|es)(?=\/|$)/i);
  if (match && isLocale(match[1]!.toLowerCase())) {
    const locale = match[1]!.toLowerCase() as Locale;
    const rest = pathname.slice(match[0].length) || '/';
    return { path: rest.startsWith('/') ? rest : `/${rest}`, locale };
  }
  return { path: pathname, locale: defaultLocale };
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isInternal = SKIP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const hasLocalePrefix = /^\/(pt|en|es)(\/|$)/i.test(pathname);

  // ───────────────────────────────────────────────────────────────────────────
  // 1) Proteção de rotas internas (admin + dashboards)
  //    Verificação de assinatura no edge; a checagem autoritativa de papel
  //    acontece em src/lib/auth.ts (que consulta o banco).
  // ───────────────────────────────────────────────────────────────────────────
  if (isInternal && !pathname.startsWith('/api')) {
    const guard = await guardInternal(request, pathname);
    if (guard) return guard;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2) Locale
  // ───────────────────────────────────────────────────────────────────────────
  const { path: canonicalPath, locale } = splitLocale(pathname);

  // Sem redirect entre `/en` e `/en/`: o Next normaliza trailing slash e um
  // redirect aqui criaria ping-pong. As duas formas reescrevem para `/` e o
  // `localizedPathname` do `src/lib/seo.ts` já emite `/en` como canônico.
  if (hasLocalePrefix) {
    // /en/destinos -> renderiza /destinos, mas o servidor precisa saber o idioma.
    // `request.headers` é o único jeito de entregar um header ao Server Component.
    const url = new URL(canonicalPath + search, request.url);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  const response = NextResponse.next();
  if (!isInternal) response.headers.set(LOCALE_HEADER, locale);
  return response;
}

async function guardInternal(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const needsAdmin = pathname.startsWith('/admin');
  const needsStaff = needsAdmin || pathname.startsWith('/dashboard');
  if (!needsStaff) return null;

  const payload = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!payload) return redirectToLogin(request);

  if (needsAdmin && !isStaff(payload.role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url), 307);
  }

  /*
   * Rotas administrativas dentro de /admin.
   *
   * Estas checagens precisam morar AQUI, e não só na page: o `redirect()` de um
   * Server Component que já está dentro de um shell renderizado chega tarde demais
   * para alterar o status HTTP (a resposta já começou a streamar e sairia 200 com
   * a instrução de redirecionamento embutida). No edge o status ainda é nosso.
   */
  const ADMIN_ONLY = [
    '/admin/equipe',
    '/dashboard/admin',
  ];
  if (ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!isAdmin(payload.role)) {
      return NextResponse.redirect(
        new URL(payload.role === 'customer' ? '/dashboard/cliente' : '/dashboard/consultora', request.url),
        307,
      );
    }
  }

  // Dashboards: cada papel tem sua própria casa.
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const home =
      payload.role === 'customer'
        ? '/dashboard/cliente'
        : payload.role === 'consultora'
          ? '/dashboard/consultora'
          : '/dashboard/admin';
    return NextResponse.redirect(new URL(home, request.url), 307);
  }

  if (pathname.startsWith('/dashboard/consultora') && payload.role === 'customer') {
    return NextResponse.redirect(new URL('/dashboard/cliente', request.url), 307);
  }
  if (pathname.startsWith('/dashboard/cliente') && payload.role !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url), 307);
  }

  return null;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/login', request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next && next !== '/login') url.searchParams.set('next', next);
  const response = NextResponse.redirect(url, 307);
  response.cookies.set('maeum_login_hint', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60,
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Exclui assets estáticos e oop de imagem para reduzir invocações de edge.
     */
    '/((?!_next/static|_next/image|images/|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|xml|txt|webmanifest|woff2?|css|js|map|mp4|webm)$).*)',
  ],
};

export { locales, type Locale };
