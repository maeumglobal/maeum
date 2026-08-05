'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Globe, Mail, Phone, MapPin, Palette, Shield, AlertCircle, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSiteConfig, updateFullSiteConfig } from '@/actions/siteConfigActions';
import { useToast } from '@/contexts/ToastContext';

type ConfigData = Record<string, Record<string, string>>;

const DEFAULT_CONFIG: ConfigData = {
  brand: { name: 'Maeum Global', tagline: 'Viagens de Luxo, Intercâmbios e Experiências Exclusivas na Ásia', logo_url: '', favicon_url: '' },
  contact: { email: '', sales_email: '', phone: '', whatsapp: '', address: '' },
  social: { instagram: '', facebook: '', youtube: '', tiktok: '', pinterest: '' },
  seo: { title_suffix: '| Maeum Global Travel', meta_description: '' },
  legal: { cnpj: '', company_name: '', privacy_url: '/politica-de-privacidade', terms_url: '/termos-de-uso' },
  visual: { primary_color: '#D4AF37', secondary_color: '#1C0A10', accent_color: '#C8A27C', background_color: '#110508' },
};

export default function AdminSiteConfigHome() {
  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('brand');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getSiteConfig();
    if (res.success && res.data) {
      setConfig(prev => {
        const merged = { ...prev };
        for (const section of Object.keys(res.data!)) {
          merged[section] = { ...(merged[section] || {}), ...res.data![section] };
        }
        return merged;
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateFullSiteConfig(config);
    if (res.success) {
      toast('Configurações salvas com sucesso!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      toast('Erro ao salvar configurações.');
    }
    setSaving(false);
  };

  const updateField = (section: string, key: string, value: string) => {
    setConfig(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [key]: value } }));
  };

  const sections = [
    { id: 'brand', label: 'Marca', icon: Globe },
    { id: 'contact', label: 'Contato', icon: Phone },
    { id: 'social', label: 'Redes Sociais', icon: Share2 },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'legal', label: 'Legal', icon: Shield },
    { id: 'visual', label: 'Visual', icon: Palette },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-[var(--admin-text-muted)]">
      <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Carregando configurações...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1">Configurações do Site</h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Informações de marca, contato, SEO e integrações</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-9 px-5 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Tudo'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-48 flex lg:flex-col gap-1 flex-wrap">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${activeSection === s.id ? 'bg-[var(--admin-primary)] text-black' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/40'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Config Form */}
        <div className="flex-1 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6">
          {activeSection === 'brand' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">🏷️ Identidade da Marca</h3>
              {[
                { key: 'name', label: 'Nome da Empresa', placeholder: 'Maeum Global' },
                { key: 'tagline', label: 'Tagline / Slogan', placeholder: 'Viagens de Luxo...' },
                { key: 'logo_url', label: 'URL do Logo', placeholder: '/logo.svg' },
                { key: 'favicon_url', label: 'URL do Favicon', placeholder: '/favicon.ico' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">{f.label}</label>
                  <Input value={config.brand?.[f.key] || ''} onChange={e => updateField('brand', f.key, e.target.value)} placeholder={f.placeholder} className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">📞 Informações de Contato</h3>
              {[
                { key: 'email', label: 'E-mail Geral', placeholder: 'contato@maeumglobal.com', type: 'email' },
                { key: 'sales_email', label: 'E-mail de Vendas', placeholder: 'vendas@maeumglobal.com', type: 'email' },
                { key: 'phone', label: 'Telefone', placeholder: '+55 (41) 98709-4799' },
                { key: 'whatsapp', label: 'WhatsApp (somente números)', placeholder: '5541987094799' },
                { key: 'address', label: 'Endereço', placeholder: 'Av. Batel 1230, Curitiba, PR' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">{f.label}</label>
                  <Input type={f.type || 'text'} value={config.contact?.[f.key] || ''} onChange={e => updateField('contact', f.key, e.target.value)} placeholder={f.placeholder} className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'social' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">🌐 Redes Sociais</h3>
              {[
                { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
                { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
                { key: 'youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' },
                { key: 'tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/...' },
                { key: 'pinterest', label: 'Pinterest URL', placeholder: 'https://pinterest.com/...' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">{f.label}</label>
                  <Input value={config.social?.[f.key] || ''} onChange={e => updateField('social', f.key, e.target.value)} placeholder={f.placeholder} className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'seo' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">🔍 SEO Global</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--admin-text-main)]">Sufixo do título</label>
                <Input value={config.seo?.title_suffix || ''} onChange={e => updateField('seo', 'title_suffix', e.target.value)} placeholder="| Maeum Global Travel" className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--admin-text-main)]">Meta Description global</label>
                <textarea value={config.seo?.meta_description || ''} onChange={e => updateField('seo', 'meta_description', e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" placeholder="Descubra roteiros de luxo exclusivos..." />
                <p className="text-[10px] text-[var(--admin-text-muted)]">{(config.seo?.meta_description || '').length}/160 caracteres</p>
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">⚖️ Informações Legais</h3>
              {[
                { key: 'company_name', label: 'Razão Social', placeholder: 'Maeum Global Travel Ltda.' },
                { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
                { key: 'privacy_url', label: 'URL Política de Privacidade', placeholder: '/politica-de-privacidade' },
                { key: 'terms_url', label: 'URL Termos de Uso', placeholder: '/termos-de-uso' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">{f.label}</label>
                  <Input value={config.legal?.[f.key] || ''} onChange={e => updateField('legal', f.key, e.target.value)} placeholder={f.placeholder} className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'visual' && (
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[var(--admin-text-main)] border-b border-[var(--admin-border)] pb-3">🎨 Personalização Visual</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'primary_color', label: 'Cor Primária (Ouro)' },
                  { key: 'secondary_color', label: 'Cor Secundária' },
                  { key: 'accent_color', label: 'Cor de Destaque' },
                  { key: 'background_color', label: 'Cor de Fundo' },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.visual?.[f.key] || '#000000'} onChange={e => updateField('visual', f.key, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--admin-border)] bg-transparent p-0.5" />
                      <Input value={config.visual?.[f.key] || ''} onChange={e => updateField('visual', f.key, e.target.value)} className="bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm font-mono" placeholder="#D4AF37" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                <p className="text-[10px] text-[var(--admin-text-muted)] mb-2 font-semibold">PREVIEW</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.visual?.primary_color || '#D4AF37' }} />
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.visual?.secondary_color || '#1C0A10' }} />
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: config.visual?.accent_color || '#C8A27C' }} />
                  <div className="w-8 h-8 rounded-full border border-[var(--admin-border)]" style={{ backgroundColor: config.visual?.background_color || '#110508' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save */}
      <div className="flex justify-end mt-2">
        <Button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-bold rounded-xl shadow-lg shadow-[var(--admin-primary)]/20">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </motion.div>
  );
}
