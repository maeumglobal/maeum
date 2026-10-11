import { permanentRedirect } from 'next/navigation';
import { resolveRequestLocale, localizedPathname } from '@/lib/seo';

/**
 * `/sobre-nos` é um alias histórico de `/sobre`.
 *
 * O redirect precisa respeitar o idioma da requisição: sem o `locale`, um
 * visitante em `/en/sobre-nos` cairia em `/sobre` (português) e perderia o
 * prefixo. `resolveRequestLocale()` lê o header `x-maeum-locale` injetado pelo
 * `src/proxy.ts` e `localizedPathname()` devolve `/en/sobre`.
 *
 * `permanentRedirect` (308) em vez de `redirect` (307): este alias é permanente,
 * então o Google deve transferir o peso do sinal.
 */
export default async function SobreNosRedirectPage() {
  const locale = await resolveRequestLocale();
  permanentRedirect(localizedPathname('/sobre', locale));
}
