'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage, isStoredImage } from '@/lib/supabaseStorage';

interface AdminImageUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
}

export default function AdminImageUpload({
  currentUrl,
  onUrlChange,
  folder = 'site',
  label,
  placeholder = 'Cole uma URL externa...',
}: AdminImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(currentUrl || '');
    if (!currentUrl) setPreview(null);
  }, [currentUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato não suportado. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    // Guarda a imagem antiga para apagar do Storage após o upload do novo arquivo.
    const previousUrl = currentUrl;

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const url = await uploadImage(file, folder);

    setUploading(false);

    if (url) {
      // Libera espaço no Supabase: remove a imagem anterior quando substituída.
      if (isStoredImage(previousUrl) && previousUrl !== url) {
        await deleteImage(previousUrl);
      }
      onUrlChange(url);
      setUrlInput(url);
      setPreview(null);
    } else {
      alert('Falha no upload. Verifique se o bucket "maeum-images" existe e está público.');
      setPreview(null);
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    onUrlChange(value);
    setPreview(null);
  };

  const handleRemove = () => {
    if (isStoredImage(currentUrl)) {
      deleteImage(currentUrl);
    }
    onUrlChange('');
    setUrlInput('');
    setPreview(null);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[11px] font-semibold text-[var(--admin-text-main)]">{label}</label>}

      {displayUrl ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-bg)] group">
          <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            title="Remover imagem"
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-[var(--admin-primary)] animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-24 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] flex items-center justify-center text-[var(--admin-text-muted)]">
          <ImageIcon className="w-5 h-5 mr-2" />
          <span className="text-xs">Sem imagem</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--admin-border)] border border-[var(--admin-border)] rounded-lg text-[10px] font-bold text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/70 transition-all disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Enviando...' : 'Upload do Computador'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
      </div>

      <input
        type="text"
        value={urlInput}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-[11px] text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)]"
      />
    </div>
  );
}
