'use client';

/**
 * Configurações do Site (seções brand / contact / social / seo / legal / visual).
 *
 * Correções: tudo via `t()` (eram 15 rótulos fixos em pt-BR), erro de leitura
 * deixa de virar "configuração vazia" silenciosa, e o botão de salvar tem
 * estado real (`saveSuccess`) sem `setTimeout` que vazava.
 *
 * + `updateSiteConfigSection` ligado: "Salvar tudo" reescreve as SEIS seções de
 * uma vez (`updateFullSiteConfig`), então duas pessoas editando partes
 * diferentes do site se sobrescrevem. "Salvar apenas esta seção" grava só o
 * bloco aberto.
 */

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Globe,
  Palette,
  Phone,
  RefreshCw,
  Save,
  Share2,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSiteConfig, updateFullSiteConfig, updateSiteConfigSection } from '@/actions/siteConfigActions';

import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminErrorState, AdminPageHeader } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

type ConfigData = Record<string, Record<string, string>>;

const DEFAULT_CONFIG: ConfigData = {
  brand: { name: 'Maeum Global', tagline: '', logo_url: '', favicon_url: '' },
  contact: { email: '', sales_email: '', phone: '', whatsapp: '', address: '' },
  social: { instagram: '', facebook: '', youtube: '', tiktok: '', pinterest: '' },
  seo: { title_suffix: '| Maeum Global Travel', meta_description: '' },
  legal: { cnpj: '', company_name: '', privacy_url: '/politica-de-privacidade', terms_url: '/termos-de-uso' },
  visual: {
    primary_color: '#D4AF37',
    secondary_color: '#1C0A10',
    accent_color: '#C8A27C',
    background_color: '#110508',
  },
};

interface Field {
  key: string;
  labelKey: string;
  placeholder?: string;
  type?: string;
}

export default function AdminSiteConfigHome() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  /** seção em gravação por `updateSiteConfigSection` (null = nada em voo) */
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('brand');


  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getSiteConfig();
    if (res.success && res.data) {
      setConfig((prev) => {
        const merged: ConfigData = { ...prev };
        for (const [section, values] of Object.entries(res.data as Record<string, Record<string, string>>)) {
          merged[section] = { ...(merged[section] || {}), ...values };
        }
        return merged;
      });
    } else {
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const res = await updateFullSiteConfig(config);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      toast(t('admin.cfg.saved'));
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

const updateField = (section: string, key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [section]: { ...(prev[section] || {}), [key]: value } }));
  };

  /**
   * Grava SÓ a seção aberta (`updateSiteConfigSection`). O "Salvar tudo"
   * acima reescreve as seis seções de uma vez: quando duas pessoas editam
   * partes diferentes do site, a última a salvar apaga o trabalho da outra.
   * O botão por seção existe exatamente para esse caso.
   */
  const handleSaveSection = async (section: string) => {
    const values = config[section];
    if (!values || savingSection) return;

    setSavingSection(section);
    setSaveSuccess(false);
    try {
      const res = await updateSiteConfigSection(section, values);
      if (res.success) {
        setSaveSuccess(true);
        toast(t('admin.cfg.sectionSaved').replace('{section}', t(`admin.cfg.${section}`)), 'success');
        window.setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        toast(res.error ?? t('state.errorTitle'), 'error');
      }
    } catch {
      toast(t('state.errorTitle'), 'error');
    } finally {
      setSavingSection(null);
    }
  };


  const sections: Array<{ id: string; labelKey: string; icon: LucideIcon }> = [
    { id: 'brand', labelKey: 'admin.cfg.brand', icon: Globe },
    { id: 'contact', labelKey: 'admin.cfg.contact', icon: Phone },
    { id: 'social', labelKey: 'admin.cfg.social', icon: Share2 },
    { id: 'seo', labelKey: 'admin.cfg.seo', icon: Globe },
    { id: 'legal', labelKey: 'admin.cfg.legal', icon: Shield },
    { id: 'visual', labelKey: 'admin.cfg.visual', icon: Palette },
  ];

  const fields: Record<string, Field[]> = {
    brand: [
      { key: 'name', labelKey: 'admin.cfg.companyName' },
      { key: 'tagline', labelKey: 'admin.cfg.tagline' },
      { key: 'logo_url', labelKey: 'admin.cfg.logoUrl', placeholder: '/logo.svg' },
      { key: 'favicon_url', labelKey: 'admin.cfg.faviconUrl', placeholder: '/favicon.ico' },
    ],
    contact: [
      { key: 'email', labelKey: 'admin.cfg.emailGeneral', type: 'email' },
      { key: 'sales_email', labelKey: 'admin.cfg.emailSales', type: 'email' },
      { key: 'phone', labelKey: 'admin.cfg.phone' },
      { key: 'whatsapp', labelKey: 'admin.cfg.whatsapp' },
      { key: 'address', labelKey: 'admin.cfg.address' },
    ],
    social: [
      { key: 'instagram', labelKey: 'Instagram', placeholder: 'https://instagram.com/…' },
      { key: 'facebook', labelKey: 'Facebook', placeholder: 'https://facebook.com/…' },
      { key: 'youtube', labelKey: 'YouTube', placeholder: 'https://youtube.com/…' },
      { key: 'tiktok', labelKey: 'TikTok', placeholder: 'https://tiktok.com/…' },
      { key: 'pinterest', labelKey: 'Pinterest', placeholder: 'https://pinterest.com/…' },
    ],
    legal: [
      { key: 'company_name', labelKey: 'admin.cfg.companyLegalName' },
      { key: 'cnpj', labelKey: 'admin.cfg.cnpj' },
      { key: 'privacy_url', labelKey: 'admin.cfg.privacyUrl', placeholder: '/politica-de-privacidade' },
      { key: 'terms_url', labelKey: 'admin.cfg.termsUrl', placeholder: '/termos-de-uso' },
    ],
  };

  const sectionTitles: Record<string, string> = {
    brand: 'admin.cfg.brandTitle',
    contact: 'admin.cfg.contactTitle',
    social: 'admin.cfg.socialTitle',
    seo: 'admin.cfg.seoTitle',
    legal: 'admin.cfg.legalTitle',
    visual: 'admin.cfg.visualTitle',
  };

  const visualFields: Field[] = [
    { key: 'primary_color', labelKey: 'admin.cfg.primaryColor' },
    { key: 'secondary_color', labelKey: 'admin.cfg.secondaryColor' },
    { key: 'accent_color', labelKey: 'admin.cfg.accentColor' },
    { key: 'background_color', labelKey: 'admin.cfg.backgroundColor' },
  ];

  const renderField = (field: Field) => (
    <div key={field.key} className="flex flex-col gap-1.5">
      <label htmlFor={`cfg-${field.key}`} className="text-xs font-semibold text-[var(--admin-text-main)]">
        {t(field.labelKey) || field.labelKey}
      </label>
      <Input
        id={`cfg-${field.key}`}
        type={field.type ?? 'text'}
        value={config[activeSection]?.[field.key] ?? ''}
        onChange={(e) => updateField(activeSection, field.key, e.target.value)}
        placeholder={field.placeholder}
        className="bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
      />
    </div>
  );

  if (error && loading === false && Object.keys(config).length <= Object.keys(DEFAULT_CONFIG).length) {
    return <AdminErrorState message={error} onRetry={load} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Globe className="w-5 h-5" />}
        title={t('admin.cfg.title')}
        subtitle={t('admin.cfg.subtitle')}
        actions={
          <>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-9 bg-[var(--admin-primary)] px-5 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? t('admin.state.loading') : saveSuccess ? t('admin.cfg.saved') : t('admin.common.save')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex flex-wrap gap-1 lg:w-48 lg:flex-col" aria-label={t('admin.cfg.title')}>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-pressed={activeSection === section.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-[var(--admin-primary)] text-black'
                    : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]/40 hover:text-[var(--admin-text-main)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(section.labelKey)}
              </button>
            );
          })}
        </nav>

        <section className="flex-1 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] pb-3">
            <h3 className="text-sm font-bold text-[var(--admin-text-main)]">
              {t(sectionTitles[activeSection] ?? 'admin.cfg.title')}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.cfg.saveSectionHint')}</span>
              <Button
                type="button"
                onClick={() => void handleSaveSection(activeSection)}
                disabled={savingSection !== null || saving}
                aria-label={t('admin.cfg.saveSection')}
                className="h-8 border border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
              >
                {savingSection === activeSection ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1" />
                )}
                {savingSection === activeSection ? t('admin.state.loading') : t('admin.cfg.saveSection')}
              </Button>
            </div>
          </div>


          {activeSection === 'seo' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cfg-title-suffix" className="text-xs font-semibold text-[var(--admin-text-main)]">
                  {t('admin.cfg.titleSuffix')}
                </label>
                <Input
                  id="cfg-title-suffix"
                  value={config.seo?.title_suffix ?? ''}
                  onChange={(e) => updateField('seo', 'title_suffix', e.target.value)}
                  className="bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cfg-meta" className="text-xs font-semibold text-[var(--admin-text-main)]">
                  {t('admin.cfg.metaDescription')}
                </label>
                <textarea
                  id="cfg-meta"
                  value={config.seo?.meta_description ?? ''}
                  onChange={(e) => updateField('seo', 'meta_description', e.target.value)}
                  className="flex min-h-[80px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                />
                <span className="text-[10px] text-[var(--admin-text-muted)]">
                  {t('admin.cfg.characters').replace('{count}', String((config.seo?.meta_description ?? '').length))}
                </span>
              </div>
            </div>
          ) : activeSection === 'visual' ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visualFields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label
                      htmlFor={`cfg-${field.key}`}
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t(field.labelKey)}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={t(field.labelKey)}
                        value={config.visual?.[field.key] || '#000000'}
                        onChange={(e) => updateField('visual', field.key, e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--admin-border)] bg-transparent p-0.5"
                      />
                      <Input
                        id={`cfg-${field.key}`}
                        value={config.visual?.[field.key] ?? ''}
                        onChange={(e) => updateField('visual', field.key, e.target.value)}
                        className="bg-[var(--admin-bg)] font-mono text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        placeholder="#D4AF37"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="mb-2 text-[10px] font-semibold text-[var(--admin-text-muted)]">
                  {t('admin.cfg.preview')}
                </p>
                <div className="flex items-center gap-3">
                  {visualFields.map((field) => (
                    <span
                      key={field.key}
                      className="h-8 w-8 rounded-full border border-[var(--admin-border)]"
                      style={{ backgroundColor: config.visual?.[field.key] || '#000000' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {(fields[activeSection] ?? []).map((field) => renderField(field))}
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[var(--admin-primary)] px-8 py-3 font-bold text-black shadow-lg hover:bg-[var(--admin-primary-hover)]"
        >
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('admin.common.save')}
        </Button>
      </div>
    </motion.div>
  );
}
