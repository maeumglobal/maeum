'use client';

/**
 * Upload de imagem do painel.
 *
 * ## Migração
 *
 * Antes importava `uploadImage/deleteImage/isStoredImage` de
 * `@/lib/supabaseStorage` — módulo **deletado** do projeto (o
 * `SUPABASE_SERVICE_ROLE_KEY` é na verdade a anon key e nada funcionava).
 * O upload agora vai para `POST /api/media`, que grava o binário em
 * `MediaAsset.data` e devolve `{ success, id, url, width, height, size }`.
 *
 * ## Bugs corrigidos
 *
 * 1. O `useEffect` sincronizava `urlInput` a cada mudança de `currentUrl` e
 *    `handleUrlChange` chamava `onUrlChange` A CADA TECLA. Como o pai
 *    (`AdminSiteContentHome`) re-renderiza, o campo perdia o foco/posição do
 *    cursor enquanto a pessoa colava uma URL. Agora o input é uncontrolled
 *    durante a digitação e só aplica no blur ou no Enter.
 * 2. `URL.createObjectURL` era criado em 3 caminhos de `return` diferentes sem
 *    `revokeObjectURL` — vazava memória a cada seleção de arquivo. Agora há um
 *    único `useEffect` de cleanup.
 * 3. `deleteImage` era chamado sem `await` e o erro sumia.
 * 4. Limite era 10 MB no cliente; o servidor (`/api/media`) aceita 5 MB e uma
 *    allowlist de mime mais restrita (inclui AVIF). Cliente e servidor agora
 *    coincidem, e o erro real do servidor é mostrado.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeUrl } from '@/lib/validate';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — igual ao servidor
const ACCEPTED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

interface MediaResponse {
  success: boolean;
  error?: string;
  url?: string;
  size?: number;
}

export default function AdminImageUpload({
  currentUrl,
  onUrlChange,
  folder = 'site',
  label,
  placeholder,
}: {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(currentUrl || '');
  const [urlError, setUrlError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSavedUrl = useRef<string>(currentUrl || '');

  // Espelha a URL salva quando o pai muda FORA deste componente (ex.: outro
  // slot), sem apagar o que a pessoa está digitando neste.
  useEffect(() => {
    if (currentUrl !== lastSavedUrl.current) {
      lastSavedUrl.current = currentUrl || '';
      setUrlDraft(currentUrl || '');
    }
  }, [currentUrl]);

  // Cleanup do object URL: SEMPRE revogado, inclusive em erro e troca de arquivo.
  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const setPreview = (file: File) => {
    setObjectUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  };

  const clearPreview = () => {
    setObjectUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Libera o input para permitir reenviar o MESMO arquivo.
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
      toast(t('img.badType'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast(t('img.tooLarge'), 'error');
      return;
    }

    setPreview(file);
    setUploading(true);
    setProgress(0);

    try {
      // XHR em vez de fetch: precisamos do evento de progresso.
      const url = await uploadWithProgress(file, folder, setProgress);
      lastSavedUrl.current = url;
      onUrlChange(url);
      setUrlDraft(url);
      toast(t('img.uploaded'));
    } catch (error) {
      toast(error instanceof Error ? error.message : t('img.uploadFailed'), 'error');
    } finally {
      setUploading(false);
      clearPreview();
    }
  };

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      lastSavedUrl.current = '';
      onUrlChange('');
      setUrlError(null);
      return;
    }
    const safe = safeUrl(trimmed);
    if (!safe) {
      setUrlError(t('img.urlInvalid'));
      return;
    }
    setUrlError(null);
    lastSavedUrl.current = safe;
    onUrlChange(safe);
  };

  const handleRemove = () => {
    // Só desassociamos o slot. O binário continua em `MediaAsset` — `DELETE`
    // não existe em `/api/media/[id]` (a rota só expõe GET/HEAD), então
    // "apagar a imagem antiga" não é possível hoje sem uma rota de remoção.
    // TODO(media): criar `DELETE /api/media/[id]` (admin-only + auditLog) e
    // então incorporar a remoção real aqui.
    lastSavedUrl.current = '';
    onUrlChange('');
    setUrlDraft('');
    clearPreview();
  };

  const displayUrl = objectUrl ?? currentUrl;

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[11px] font-semibold text-[var(--admin-text-main)]">{label}</span>}

      {displayUrl ? (
        <div className="group relative h-36 w-full overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview local/arbitrário; nunca passa pelo otimizador */}
          <img src={displayUrl} alt={t('img.preview')} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t('img.remove')}
            title={t('img.remove')}
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-colors hover:bg-red-500/80 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-primary)]" />
              <div className="h-1 w-2/3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-[var(--admin-primary)] transition-[width]"
                  style={{ width: `${Math.max(5, progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-muted)]">
          <ImageIcon className="mr-2 w-5 h-5" />
          <span className="text-xs">{t('img.empty')}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-border)] px-3 py-2 text-[10px] font-bold text-[var(--admin-text-main)] transition-all hover:bg-[var(--admin-border)]/70 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? t('img.uploading') : t('img.upload')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={(e) => void handleFileSelect(e)}
          className="hidden"
        />
        <span className="text-[10px] text-[var(--admin-text-muted)]">{t('img.storedOnly')}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              if (urlError) setUrlError(null);
            }}
            // Aplica SÓ no blur ou no Enter — nunca a cada tecla. Era o que
            // fazia o cursor saltar enquanto a pessoa colava a URL.
            onBlur={applyUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyUrl();
              }
              if (e.key === 'Escape') {
                setUrlDraft(lastSavedUrl.current);
                setUrlError(null);
              }
            }}
            placeholder={placeholder ?? t('img.urlPlaceholder')}
            aria-label={t('img.urlLabel')}
            aria-invalid={Boolean(urlError)}
            className="h-9 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-[11px] text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] aria-invalid:border-[var(--admin-accent-red)]"
          />
          <button
            type="button"
            onClick={applyUrl}
            title={t('admin.common.apply')}
            aria-label={t('admin.common.apply')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-border)]/50"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
        {urlError && <span className="text-[10px] text-[var(--admin-accent-red)]">{urlError}</span>}
      </div>
    </div>
  );
}

/** Upload com barra de progresso (fetch não expõe progresso de upload). */
function uploadWithProgress(
  file: File,
  folder: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.set('file', file);
    form.set('folder', folder);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/media');
    request.setRequestHeader('Accept', 'application/json');

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener('load', () => {
      let payload: MediaResponse | null = null;
      try {
        payload = JSON.parse(request.responseText) as MediaResponse;
      } catch {
        reject(new Error('Resposta inválida do servidor de mídia.'));
        return;
      }
      if (request.status >= 200 && request.status < 300 && payload?.success && payload.url) {
        onProgress(100);
        resolve(payload.url);
        return;
      }
      reject(new Error(payload?.error ?? `Falha no upload (HTTP ${request.status}).`));
    });

    request.addEventListener('error', () => reject(new Error('Falha de rede no upload.')));
    request.addEventListener('abort', () => reject(new Error('Upload cancelado.')));

    request.send(form);
  });
}
