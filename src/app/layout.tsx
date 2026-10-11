import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteContentProvider } from "@/contexts/SiteContentContext";
import CookieBanner from "@/components/CookieBanner";
import JsonLd from "@/components/seo/JsonLd";
import { htmlLang } from "@/i18n/config";
import { getTextOverrides, getMediaMap, getNavigationMap, emptyTextOverrides, type NavigationMap } from "@/lib/cmsData";
import { getAuth } from "@/lib/auth";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";
import {
  HOME_SEO,
  buildMetadata,
  resolveRequestLocale,
  travelAgencyJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

/**
 * Metadata raiz â€” APENAS o fallback do site.
 *
 * PÃ¡ginas que querem ser indexadas DEVEM exportar o prÃ³prio `metadata` /
 * `generateMetadata` usando `buildMetadata()` de `@/lib/seo`; o que nÃ£o fizer
 * isso herda este bloco e acaba com tÃ­tulo/descriÃ§Ã£o da home duplicados.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const home = HOME_SEO[locale];

  return {
    ...buildMetadata({
      title: home.title,
      description: home.description,
      path: "/",
      locale,
      image: "/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp",
    }),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/images/favicon.png", type: "image/png", sizes: "476x446" },
      ],
      apple: [{ url: "/images/logo.png", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    manifest: "/manifest.webmanifest",
    category: "travel",
    verification: {
      google: "4GaRrcm7r8Z6Xr_AGwSBn2e9KMBMJL43_aFipF_uSqs",
      other: {
        "msvalidate.01": "B6734EB02EBE5B3048FD4A10BC6328B7",
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1A0F14" },
    { media: "(prefers-color-scheme: dark)", color: "#1A0F14" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/** Mapa slot â†’ fallback estÃ¡tico (nunca depende de banco). */
const staticMediaMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const slot of MEDIA_SLOTS) map[slot.key] = slot.fallback;
  return map;
};

/**
 * ConteÃºdo do CMS para o `SiteContentProvider`.
 *
 * O painel admin Ã© opcional: se o banco estiver fora do ar (ou o schema ainda
 * nÃ£o tiver a tabela), seguimos com os fallbacks estÃ¡ticos de
 * `src/lib/mediaSlots.ts` e o dicionÃ¡rio vazio. Ã‰ isso que mantÃ©m o caminho
 * crÃ­tico do layout independente do banco.
 */
async function loadCmsContent(): Promise<{
  text: Awaited<ReturnType<typeof getTextOverrides>>;
  media: Record<string, string>;
  navigation: NavigationMap;
}> {
  const fallback = { text: emptyTextOverrides(), media: staticMediaMap(), navigation: {} };
  try {
    const [text, media, navigation] = await Promise.all([
      getTextOverrides(),
      getMediaMap(),
      getNavigationMap(),
    ]);
    return {
      text: text && text.pt && text.en && text.es ? text : fallback.text,
      media: media && Object.keys(media).length > 0 ? media : fallback.media,
      navigation: navigation ?? fallback.navigation,
    };
  } catch (error) {
    console.warn("[layout] CMS indisponÃ­vel, usando fallbacks estÃ¡ticos:", error);
    return fallback;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `resolveRequestLocale()` Ã© memoizado com React.cache: `generateMetadata` e o
  // layout leem `x-maeum-locale` uma Ãºnica vez por render.
  const locale = await resolveRequestLocale();
  // CMS, sessÃ£o e mÃ­dia em paralelo: uma Ãºnica ida ao banco por request.
  const [{ text, media, navigation }, auth] = await Promise.all([loadCmsContent(), getAuth()]);

  return (
    <html
      lang={htmlLang[locale]}
      className={`${plusJakarta.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <JsonLd data={travelAgencyJsonLd(locale)} />
        <JsonLd id="website-jsonld" data={websiteJsonLd(locale)} />
        <ThemeProvider>
          <SiteContentProvider initialText={text} initialMedia={media} initialNavigation={navigation}>
            <LanguageProvider initialLocale={locale}>
              {/* A sessÃ£o Ã© resolvida no servidor: elimina o fetch /api/me por pÃ¡gina. */}
              <AuthProvider initialUser={auth?.user ?? null}>
                <ToastProvider>
                  {children}
                  <CookieBanner />
                </ToastProvider>
              </AuthProvider>
            </LanguageProvider>
          </SiteContentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
