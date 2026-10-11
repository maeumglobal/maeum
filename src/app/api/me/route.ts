import { NextResponse } from 'next/server';
import { getAuth, type AuthUser } from '@/lib/auth';

/**
 * Sessão atual do visitante.
 *
 * Usado pelo `AuthContext` quando o layout não injeta `initialUser`.
 * A checagem é feita pelo servidor (`getAuth()` valida a assinatura do cookie
 * e revalida `isActive`/`sessionVersion` no Postgres) — o cliente nunca decide
 * quem é o usuário. Sem sessão válida devolve `{ user: null }` com HTTP 200 para
 * não poluir o console do navegador com 401 esperado.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await getAuth();
    if (!ctx) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user: AuthUser = ctx.user;
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          jobTitle: user.jobTitle,
          locale: user.locale,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, private' },
      },
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}