import type { Metadata } from 'next';
import LoginClient from './LoginClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://maeumglobal.com';

/**
 * `/login` nunca deve entrar no índice de buscadores.
 * TODO: migrar para `buildMetadata` de `src/lib/seo.ts` quando o helper existir.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    title: 'Login | MaeumGlobal',
    description: 'Acesso à área restrita da MaeumGlobal.',
    robots: { index: false, follow: false },
  };
}

export default function LoginPage() {
  return <LoginClient />;
}