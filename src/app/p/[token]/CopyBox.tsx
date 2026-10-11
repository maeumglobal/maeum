'use client';

/**
 * Campo de cópia (chave Pix, dados bancários).
 *
 * Client Component isolado porque usa `navigator.clipboard` — o resto da
 * página `/p/[token]` permanece Server Component.
 */
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyBox({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard bloqueado (http sem TLS): o valor continua selecionável.
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-[var(--admin-text-muted)]">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2">
        <code className="flex-1 break-all text-xs text-[var(--admin-text-main)]">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-border)]"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}

export default CopyBox;
