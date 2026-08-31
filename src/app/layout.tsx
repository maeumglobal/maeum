import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteContentProvider } from "@/contexts/SiteContentContext";
import CookieBanner from "@/components/CookieBanner";
import { htmlLang, type Locale } from "@/i18n/config";
import { seoDefaults, siteName } from "@/i18n";
import { getTextOverrides, getMediaMap } from "@/lib/cmsData";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maeumglobal.com";

async function getLocaleFromHeaders(): Promise<Locale> {
  const h = await headers();
  const x = h.get("x-maeum-locale");
  if (x === "en" || x === "es" || x === "pt") return x;
  return "pt";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const seo = seoDefaults[locale];

  const alternates: Record<string, string> = {
    canonical: `${SITE_URL}/${locale === "pt" ? "" : locale + "/"}`,
  };
  for (const l of ["pt", "en", "es"] as const) {
    alternates[l] = `${SITE_URL}/${l === "pt" ? "" : l + "/"}`;
  }
  alternates["x-default"] = `${SITE_URL}/`;

  return {
    metadataBase: new URL(SITE_URL),
    title: seo.title,
    description: seo.description,
    keywords: ["Turismo de Luxo", "Viagem Coreia do Sul", "Intercâmbio Coreia", "MaeumGlobal"],
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName,
      locale: htmlLang[locale].replace("-", "_"),
      type: "website",
      url: SITE_URL,
    },
    alternates: { languages: alternates },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    icons: { icon: "/favicon.ico" },
    verification: {
      google: "4GaRrcm7r8Z6Xr_AGwSBn2e9KMBMJL43_aFipF_uSqs",
      other: {
        "msvalidate.01": "B6734EB02EBE5B3048FD4A10BC6328B7",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromHeaders();
  const [initialText, initialMedia] = await Promise.all([getTextOverrides(), getMediaMap()]);

  return (
    <html
      lang={htmlLang[locale]}
      className={`${plusJakarta.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <SiteContentProvider initialText={initialText} initialMedia={initialMedia}>
            <LanguageProvider initialLocale={locale}>
              <AuthProvider>
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