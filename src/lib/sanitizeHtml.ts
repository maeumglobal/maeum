/**
 * Sanitizador CONSERVADOR de HTML vindo do painel admin (`BlogPost.content`).
 *
 * ## Por que existe
 *
 * `BlogPost.content` é HTML digitado no admin e renderizado em
 * `src/app/journal/[slug]/page.tsx`. Injetá-lo com `dangerouslySetInnerHTML`
 * sem filtro é XSS armazenado: qualquer usuário com acesso ao painel
 * executaria JS no domínio de produção. Este arquivo é o ÚNICO lugar do
 * projeto autorizado a tocar em `dangerouslySetInnerHTML` com HTML do banco.
 *
 * ## Estratégia (allowlist, nunca blocklist)
 *
 * 1. Remove comentários, `<!DOCTYPE>`, `<![CDATA[ ]]>` e processing instructions
 *    (o scanner de tags não deve "encontrar" script dentro de um comentário).
 * 2. Descarta a ÁRVORE inteira de tags perigosas (`script`, `style`, `iframe`
 *    não permitido, `object`, `embed`, `form`, `svg`, `video`, ...).
 * 3. Reconstrói o HTML tag a tag usando uma allowlist de tags e de atributos.
 *    Tag desconhecida é **descartada mas o texto interno é preservado**
 *    (unwrap) — é o comportamento que menos destrói o texto do editor.
 * 4. Descarta TODOS os atributos `on*` (e `style`, `srcset`, `formaction`,
 *    `xlink:href`) e qualquer atributo fora da allowlist da tag.
 * 5. Valida URLs (atributos `href`/`src`/`cite`) contra uma allowlist de
 *    esquemas — `javascript:`, `vbscript:`, `data:`, `file:`, `blob:` e
 *    `about:` são rejeitados, inclusive com entidades/obfuscação
 *    (`&#106;avascript:`, `java\tscript:`, `&colon;`).
 * 6. `a` externo ganha `rel="noopener noreferrer nofollow"` + `target="_blank"`.
 * 7. `img` recebe `alt` (mesmo vazio, para não ser lido como decorativo) e
 *    `loading="lazy"` por padrão.
 * 8. `iframe` só sobrevive para os hosts de vídeo da allowlist (youtube-nocookie
 *    por padrão) e sempre recebe `sandbox` + `referrerpolicy` restritivos.
 * 9. Fecha no fim todas as tags que ficaram abertas — a saída é sempre
 *    balanceada, o que impede quebras de layout e injeção de conteúdo.
 *
 * ## Limitações assumidas (conservadoras de propósito)
 *
 * - Não há CSS em escopo nem remoção de `<style>` inline: `<style>` é removido.
 * - Aninhamento inválido (ex.: `<p>` dentro de `<p>`) não é normalizado; o
 *   navegador resolve sozinho e não há risco de script.
 * - A limpeza é por tokenização de tags, não por parser completo de HTML.
 *   Tudo que não for reconhecido é descartado — nunca "reparado".
 */

import { createElement, type CSSProperties } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
 * Listas de allowlist
 * ────────────────────────────────────────────────────────────────────────── */

/** Tags que não têm tag de fechamento. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

/**
 * Tags cuja ÁRVORE inteira é descartada — remover só a tag deixaria o corpo
 * (`alert(1)`, `expression(...)`, formulários) exposto no texto.
 *
 * ⚠️ `iframe` NÃO entra aqui: ele é filtrado por HOST na passada 2 (allowlist
 * de youtube-nocookie/Vimeo). Quando o host não é permitido, as duas tags são
 * descartadas e sobra apenas o texto interno — que é inerte.
 */
const DROP_TREE_TAGS: readonly string[] = [
  'script', 'style', 'noscript', 'template', 'object', 'embed',
  'applet', 'form', 'input', 'button', 'select', 'option', 'optgroup',
  'textarea', 'link', 'meta', 'base', 'head', 'title', 'svg', 'math',
  'frame', 'frameset', 'xml', 'canvas', 'audio', 'video', 'source', 'track',
  'param', 'portal', 'dialog', 'marquee', 'blink',
];

/**
 * Tags estruturais e desconhecidas são tratadas igualmente: a TAG é
 * descartada e o texto interno preservado ("unwrap"). Isso evita que o HTML do
 * admin quebre os landmarks da página (`<main>`, `<nav>`, `<section>`,
 * `<html>`, `<body>`, `<center>`, `<font>`…) sem apagar o artigo.
 *
 * Allowlist de tags do conteúdo editorial.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
  'small', 'sub', 'sup', 'mark', 'abbr', 'span', 'div',
  'blockquote', 'q', 'cite',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'pre', 'code', 'kbd', 'samp', 'var',
  'time',
  'iframe',
]);

/** Atributos aceitos em qualquer tag. */
const GLOBAL_ATTRS = new Set(['class', 'title', 'lang', 'dir']);

/** Atributos aceitos por tag (além dos globais). */
const TAG_ATTRS: Readonly<Record<string, ReadonlySet<string>>> = {
  a: new Set(['href', 'rel', 'target']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  td: new Set(['colspan', 'rowspan', 'headers']),
  th: new Set(['colspan', 'rowspan', 'scope', 'headers', 'abbr']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
  ol: new Set(['start', 'reversed', 'type']),
  time: new Set(['datetime']),
  q: new Set(['cite']),
  blockquote: new Set(['cite']),
  iframe: new Set([
    'src', 'width', 'height', 'allow', 'frameborder', 'title',
  ]),
};

/** Atributos cujo valor é URL e precisa passar pela allowlist de esquemas. */
const URL_ATTRS = new Set(['href', 'src', 'cite']);

/** Atributos perigosos que nunca passam, mesmo sendo "globais". */
const BANNED_ATTRS = new Set([
  'style', 'srcset', 'formaction', 'xlink:href', 'srcdoc', 'background',
  'dynsrc', 'lowsrc', 'ping', 'http-equiv', 'content', 'is',
]);

/** Esquemas de URL tolerados em `a`/`img`/`cite`. */
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);

/** Esquemas que só fazem sentido em link (`a`), nunca em `src`. */
const LINK_ONLY_SCHEMES = new Set(['mailto', 'tel', 'sms']);

/** Hosts de vídeo liberados para `<iframe>` (CSP já permite estes). */
const DEFAULT_IFRAME_HOSTS: readonly string[] = [
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'www.youtube.com.br',
  'player.vimeo.com',
];

/* ────────────────────────────────────────────────────────────────────────────
 * Regexes
 * ────────────────────────────────────────────────────────────────────────── */

/** `<!-- ... -->`, `<!DOCTYPE ...>`, `<![CDATA[ ... ]]>` e `<?php ?>`. */
const STRIP_NON_MARKUP =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[?!][^>]*>/g;

/** `<tag attr="v" …>` — o interior nunca pode cruzar um `>` não citado. */
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;

/** `nome`, `nome=valor`, `nome="valor"`, `nome='valor'`. */
const ATTR_RE =
  /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const SCHEME_RE = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/** Caracteres invisíveis usados para quebrar o esquema de uma URL maliciosa. */
const INVISIBLE_RE =
  /[\u0000-\u0020\u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff]/g;

const DANGEROUS_SCHEME_RE =
  /^(?:javascript|vbscript|data|file|blob|about|jar|view-source|ms-its):/i;

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Entidades mínimas, suficientes para quebrar a checagem de esquema
 * (`&colon;`, `&#58;`). Só é usada para DECIDIR: o valor devolvido ao HTML
 * é o original.
 */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  colon: ':', tab: '\t', newline: '\n', sol: '/', amp: '&', lpar: '(', rpar: ')',
  quest: '?', num: '#', semi: ';', lt: '<', gt: '>',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (all, body: string) => {
    if (body.charAt(0) === '#') {
      const hex = body.charAt(1) === 'x' || body.charAt(1) === 'X';
      const code = hex ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return all;
      try {
        return String.fromCodePoint(code);
      } catch {
        return all;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? all;
  });
}

function escapeAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isExternalHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Allowlist de esquemas. Devolve o valor ORIGINAL (trim) quando é seguro ou
 * `null` quando deve ser descartado.
 */
function sanitizeUrl(raw: string, tag: string): string | null {
  const original = String(raw ?? '').trim();
  if (!original) return null;

  // Versão "compacta" (sem invisíveis, com entidades decodificadas) só para
  // decidir: `java\tscript:` e `&#106;avascript:` têm de cair no mesmo caso.
  const probe = decodeEntities(original).replace(INVISIBLE_RE, '');
  if (!probe) return null;

  const schemeMatch = SCHEME_RE.exec(probe);
  if (schemeMatch) {
    const scheme = schemeMatch[1]!.toLowerCase();
    if (!SAFE_SCHEMES.has(scheme)) return null;
    if (LINK_ONLY_SCHEMES.has(scheme) && tag !== 'a') return null;
    return original;
  }

  if (DANGEROUS_SCHEME_RE.test(probe)) return null;
  return original;
}

function iframeHostAllowed(src: string, hosts: ReadonlySet<string>): boolean {
  // Só https e só o host exato da allowlist. `https://<host>@evil.com` e
  // `https://evil.com/?x=<host>` não casam porque o host é capturado inteiro.
  const match = /^https:\/\/([^/?#]+)/i.exec(src.trim());
  if (!match) return false;
  return hosts.has(match[1]!.toLowerCase());
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sanitização de atributos
 * ────────────────────────────────────────────────────────────────────────── */

function sanitizeAttributes(
  tag: string,
  raw: string,
  ctx: { iframeHosts: ReadonlySet<string>; emptyAltLabel?: string },
): string | null {
  const tagAllowed = TAG_ATTRS[tag];
  const collected = new Map<string, string>();

  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    const name = match[1]!.toLowerCase();
    // Repetição de atributo: o primeiro vence (comportamento do HTML parser).
    if (collected.has(name)) continue;
    if (name.startsWith('on')) continue;
    if (BANNED_ATTRS.has(name)) continue;

    const value = match[2] ?? match[3] ?? match[4] ?? '';
    const isGlobal = GLOBAL_ATTRS.has(name);
    const isListed = tagAllowed?.has(name) ?? false;
    if (!isGlobal && !isListed) continue;

    if (URL_ATTRS.has(name)) {
      const url = sanitizeUrl(value, tag);
      if (!url) continue;
      if (tag === 'iframe' && name === 'src' && !iframeHostAllowed(url, ctx.iframeHosts)) continue;
      collected.set(name, url);
      continue;
    }

    collected.set(name, value);
  }

  // ── reforço por tag ──
  if (tag === 'a') {
    const href = collected.get('href');
    // `a` sem href não é navigável: o admin provavelmente quis texto puro.
    if (!href) return null;
    if (isExternalHttpUrl(href)) {
      collected.set('target', '_blank');
      collected.set('rel', 'noopener noreferrer nofollow');
    } else {
      collected.delete('target');
      collected.delete('rel');
    }
  }

  if (tag === 'img') {
    if (!collected.get('src')) return null;
    collected.set('loading', collected.get('loading') === 'eager' ? 'eager' : 'lazy');
    collected.set('decoding', 'async');
    if (!collected.has('alt')) collected.set('alt', ctx.emptyAltLabel ?? '');
  }

  if (tag === 'iframe') {
    // Só sobrevive `iframe` de vídeo com host na allowlist.
    if (!collected.get('src')) return null;
    collected.set('loading', 'lazy');
    collected.set('referrerpolicy', 'strict-origin-when-cross-origin');
    // YouTube/Vimeo funcionam com este sandbox; qualquer coisa mais é bloqueada.
    collected.set('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
  }

  const out: string[] = [];
  for (const [name, value] of collected) {
    out.push(value === '' ? name : `${name}="${escapeAttrValue(value)}"`);
  }
  return out.length ? ` ${out.join(' ')}` : '';
}

/* ────────────────────────────────────────────────────────────────────────────
 * API pública
 * ────────────────────────────────────────────────────────────────────────── */

export interface SanitizeHtmlOptions {
  /** Hosts liberados para `<iframe>`. Padrão: youtube(-nocookie) e Vimeo. */
  allowedIframeHosts?: readonly string[];
  /** Texto usado no `alt` de imagens sem atributo. */
  emptyAltLabel?: string;
}

/**
 * Sanitiza HTML editorial. Devolve string pronta para
 * `dangerouslySetInnerHTML` (ou `''` quando nada sobrevive).
 */
export function sanitizeHtml(input: unknown, options: SanitizeHtmlOptions = {}): string {
  if (typeof input !== 'string' || input.length === 0) return '';

  const iframeHosts = new Set(
    (options.allowedIframeHosts ?? DEFAULT_IFRAME_HOSTS).map((h) => h.toLowerCase()),
  );
  const ctx = { iframeHosts, emptyAltLabel: options.emptyAltLabel };

  let html = input.replace(/\0/g, '').replace(STRIP_NON_MARKUP, '');

  // 1) Árvores perigosas: remove conteúdo + tag de abertura/fechamento.
  for (const tag of DROP_TREE_TAGS) {
    html = html
      .replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?(?:<\\/${tag}\\s*>|$)`, 'gi'), '')
      .replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  // 2) Reconstrução tag a tag.
  const out: string[] = [];
  const stack: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;

  while ((match = TAG_RE.exec(html)) !== null) {
    out.push(html.slice(cursor, match.index));
    cursor = TAG_RE.lastIndex;

    const isClosing = match[1] === '/';
    const tag = match[2]!.toLowerCase();
    const rawAttrs = match[3] ?? '';

    if (isClosing) {
      if (VOID_TAGS.has(tag) || !ALLOWED_TAGS.has(tag)) continue;
      const index = stack.lastIndexOf(tag);
      if (index === -1) continue; // fechamento órfão: descarta
      // Fecha o que ficou aberto dentro desta tag (mantém o balanceamento).
      for (let i = stack.length - 1; i > index; i -= 1) out.push(`</${stack[i]}>`);
      out.push(`</${tag}>`);
      stack.length = index;
      continue;
    }

    if (VOID_TAGS.has(tag) && !ALLOWED_TAGS.has(tag)) continue;
    if (!ALLOWED_TAGS.has(tag)) {
      // Tag desconheada/estrutural: descarta a TAG e preserva o texto interno.
      continue;
    }

    const attrs = sanitizeAttributes(tag, rawAttrs, ctx);
    if (attrs === null) continue; // `a` sem href, `img`/`iframe` sem src válido

    out.push(`<${tag}${attrs}>`);
    if (!VOID_TAGS.has(tag)) stack.push(tag);
  }

  out.push(html.slice(cursor));

  // 3) Fecha o que ficou aberto — a saída é sempre balanceada.
  for (let i = stack.length - 1; i >= 0; i -= 1) out.push(`</${stack[i]}>`);

  return out.join('');
}

export interface SanitizedHtmlProps {
  /** HTML bruto vindo do admin (passa por `sanitizeHtml`). */
  html: unknown;
  className?: string;
  style?: CSSProperties;
  options?: SanitizeHtmlOptions;
}

/**
 * Server Component que renderiza HTML já sanitizado.
 *
 * Existe como componente (e não como `dangerouslySetInnerHTML` espalhado nas
 * páginas) para Concentrar a única API perigosa do projeto neste arquivo: as
 * páginas passam o HTML cru e não têm como injetar algo não sanitizado.
 *
 * Devolve `null` quando o sanitizador removeu tudo — o layout decide o que
 * fazer (a página normalmente cai para o `excerpt`).
 */
export function SanitizedHtml({ html, className, style, options }: SanitizedHtmlProps) {
  const clean = sanitizeHtml(html, options);
  if (!clean.trim()) return null;
  return createElement('div', {
    className,
    style,
    'data-sanitized-html': '',
    dangerouslySetInnerHTML: { __html: clean },
  });
}

export default SanitizedHtml;