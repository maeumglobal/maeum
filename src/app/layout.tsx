import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import CookieBanner from "@/components/CookieBanner";

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

export const metadata: Metadata = {
  title: "MaeumGlobal | Turismo & Intercâmbio de Luxo na Ásia",
  description: "O MaeumGlobal é um aplicativo e plataforma de gestão de turismo de luxo e intercâmbio. Descubra a Ásia antes mesmo de embarcar. Roteiros personalizados, hotéis de luxo, experiências exclusivas e intercâmbio de alto padrão.",
  keywords: ["Turismo de Luxo", "Viagem Coreia do Sul", "Viagem Japão", "Intercâmbio Coreia", "Maeum Global"],
  verification: {
    google: "4GaRrcm7r8Z6Xr_AGwSBn2e9KMBMJL43_aFipF_uSqs",
    other: {
      "msvalidate.01": "B6734EB02EBE5B3048FD4A10BC6328B7",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
