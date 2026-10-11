import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Allowlist de imagens remotas.
 *
 * NÃO usar `hostname: '**'`: o otimizador do Next vira um proxy aberto e passa
 * a ser SSRF/abuso de bandwidth. Só entram hosts que realmente servem mídia
 * do projeto:
 *  - `images.unsplash.com`  → fallbacks de `src/lib/mediaSlots.ts`
 *  - `*.supabase.co`       → storage legado (enquanto a migração não conclui)
 *  - `images.maeumglobal.com.br` / domínio próprio → CDN de produção
 *
 * Qualquer URL fora desta lista NÃO deve chegar em `next/image` — use
 * `<SmartImage>` (`src/components/SmartImage.tsx`), que cai para `<img>`.
 */
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
  { protocol: "https", hostname: "images.maeumglobal.com.br", pathname: "/**" },
  { protocol: "https", hostname: "maeumglobal.com.br", pathname: "/images/**" },
  { protocol: "https", hostname: "www.maeumglobal.com.br", pathname: "/images/**" },
];

/**
 * CSP permissivo o suficiente para não quebrar o Next.js (RSC inline bootstrap,
 * HMR do dev, iframes de vídeo do campo `videoEmbed`) e restritivo onde importa.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // `unsafe-inline` é obrigatório em produção: o Next injeta o payload do RSC e
  // o bootstrap de hidratação em <script> inline. `unsafe-eval` só no dev
  // (React Fast Refresh); removê-lo quebraria `next dev`.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  // Tailwind v4 / framer-motion injetam <style> inline.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' https: blob:",
  // react-query / Supabase / Stripe chamam de fora.
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // `videoEmbed` dos pacotes/jornadas usa YouTube/Vimeo.
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=(self)",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Legado: navegadores modernos ignoram; desligado para não reativar XSS.
  { key: "X-XSS-Protection", value: "0" },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns,
    // `qualities` é obrigatório no Next 16 (default [75]); `quality={100}` é
    // usado em `src/app/page.tsx` e `src/app/destinos/page.tsx`.
    qualities: [50, 75, 90, 100],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // Mídia do CMS (`cms_media` / `MediaAsset`) não muda todo dia: 30 dias.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Removido daqui: `unoptimized: true` global (matava o AVIF/WebP inteiro).
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
