'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Palette, Layers, Folder, Database, Users, Shield,
  CheckCircle2, Plus, Trash2, ArrowUp, ArrowDown, Edit3, Info,
  TrendingUp, DollarSign, Briefcase, FileText, Send, Share2, Award,
  BookOpen, Globe, Mail, Key, Compass, Sparkles, GraduationCap, Map
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminDashboardHome from '@/components/admin/dashboard/AdminDashboardHome';
import AdminLeadsHome from '@/components/admin/leads/AdminLeadsHome';

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard_home');
  const { theme, updateTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  // Color inputs state
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary);
  const [secondaryColor, setSecondaryColor] = useState(theme.colors.secondary);
  const [accentColor, setAccentColor] = useState(theme.colors.accent);
  const [bgColor, setBgColor] = useState(theme.colors.background);
  const [visualSaved, setVisualSaved] = useState(false);

  // Data States
  const [blocks, setBlocks] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kbeautyExperiences, setKbeautyExperiences] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [experienceFilter, setExperienceFilter] = useState('all');

  // CRUD Package/Exchange/Experience States
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgType, setPkgType] = useState('package');
  const [pkgDestination, setPkgDestination] = useState('Coreia do Sul');

  // Experience CRUD states
  const [expTitle, setExpTitle] = useState('');
  const [expSlug, setExpSlug] = useState('');
  const [expPrice, setExpPrice] = useState(0);
  const [expDuration, setExpDuration] = useState(0);
  const [expCategory, setExpCategory] = useState('');
  const [expBookingType, setExpBookingType] = useState('direct');
  const [expLocation, setExpLocation] = useState('');
  const [expDescription, setExpDescription] = useState('');

  // Category CRUD states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // Journey CRUD states
  const [journeyTitle, setJourneyTitle] = useState('');
  const [journeyPrice, setJourneyPrice] = useState(0);
  const [journeyDuration, setJourneyDuration] = useState(0);

  // Blog State
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostAuthor, setNewPostAuthor] = useState('');

  // Site Config State
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [configSaved, setConfigSaved] = useState(false);

  const loadData = () => {
    setBlocks(db.get('cms_blocks') || []);
    setPackages(db.get('packages') || []);
    setLeads(db.get('crm_leads') || []);
    setProposals(db.get('proposals') || []);
    setUsersList(db.get('users') || []);
    setExperiences(db.get('experiences') || []);
    setCategories(db.get('categories') || []);
    setKbeautyExperiences(db.get('kbeauty_experiences') || []);
    setCampuses(db.get('exchange_campuses') || []);
    setJourneys(db.get('journeys') || []);
    setBlogPosts(db.get('blog_posts') || []);
    setSiteConfig(db.get('site_config') || {});
  };

  const updateSiteConfig = (section: string, key: string, value: string) => {
    setSiteConfig((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const handleSaveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.save('site_config', siteConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
    toast('Configurações do site salvas com sucesso!');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    updateTheme({
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        accentHover: accentColor,
        text: theme.colors.text,
        background: bgColor,
        card: theme.colors.card
      }
    });
    setVisualSaved(true);
    setTimeout(() => setVisualSaved(false), 3000);
  };

  // Reorder Blocks
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const updated = [...blocks];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    setBlocks(updated);
    db.save('cms_blocks', updated);
  };

  // Toggle Block Status
  const toggleBlockActive = (index: number) => {
    const updated = [...blocks];
    updated[index].active = !updated[index].active;
    setBlocks(updated);
    db.save('cms_blocks', updated);
  };

  // CRUD Create Item
  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || !pkgPrice) return;

    const allPkgs = db.get('packages');
    const newPkg = {
      id: crypto.randomUUID(),
      title: pkgTitle,
      slug: pkgTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: Number(pkgPrice),
      duration: '10 Dias',
      destination: pkgDestination,
      type: pkgType, // package, exchange, experience
      description: `Novo ${pkgType === 'package' ? 'Pacote' : pkgType === 'exchange' ? 'Intercâmbio' : 'Experiência'} premium cadastrado pelo painel administrativo.`,
      gallery: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'],
      included: ['Hospedagem 5 estrelas', 'Traslados privativos'],
      not_included: ['Voos internacionais'],
      status: 'active'
    };

    allPkgs.push(newPkg);
    db.save('packages', allPkgs);
    setPkgTitle('');
    setPkgPrice(0);
    loadData();
    toast(`${pkgType === 'package' ? 'Pacote' : pkgType === 'exchange' ? 'Intercâmbio' : 'Experiência'} criado com sucesso!`);
  };

  // CRUD Delete Item
  const handleDeletePackage = (id: string) => {
    const allPkgs = db.get('packages');
    const filtered = allPkgs.filter((p: any) => p.id !== id);
    db.save('packages', filtered);
    loadData();
    toast('Item removido com sucesso!');
  };

  // Create Blog Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle) return;
    const all = db.get('blog_posts');
    const newP = {
      id: crypto.randomUUID(),
      title: newPostTitle,
      author: newPostAuthor || 'Maeum Editor',
      created_at: new Date().toISOString().split('T')[0]
    };
    all.push(newP);
    db.save('blog_posts', all);
    setNewPostTitle('');
    setNewPostAuthor('');
    loadData();
    toast('Artigo publicado com sucesso!');
  };

  const handleDeletePost = (id: string) => {
    const filtered = blogPosts.filter(p => p.id !== id);
    db.save('blog_posts', filtered);
    loadData();
    toast('Artigo removido.');
  };

  return (
    <div className="admin-dashboard flex h-screen w-screen bg-[var(--admin-bg)] overflow-hidden font-sans">
      <AdminSidebar activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar min-w-0 w-full">
          {activeSubTab === 'dashboard_home' && <AdminDashboardHome />}
          {activeSubTab === 'leads' && <AdminLeadsHome />}
          
          <div className="min-h-[400px]">
          {/* TAB: VISUAL IDENTITY */}
          {activeSubTab === 'visual' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Personalização Visual do Site</h2>
              
              {visualSaved && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 mb-6">
                  ✓ Configurações salvas e aplicadas em tempo real em todo o site via Variáveis CSS!
                </div>
              )}

              <form onSubmit={handleSaveTheme} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Cor Primária (Acentos, Títulos)</label>
                    <div className="flex gap-2">
                      <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 p-0 border border-border cursor-pointer" />
                      <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Cor Secundária (Fundo Escuro, Rodapés)</label>
                    <div className="flex gap-2">
                      <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 p-0 border border-border cursor-pointer" />
                      <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Cor de Acento Dourado/Areia</label>
                    <div className="flex gap-2">
                      <Input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-12 h-10 p-0 border border-border cursor-pointer" />
                      <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Fundo Geral do Site</label>
                    <div className="flex gap-2">
                      <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-10 p-0 border border-border cursor-pointer" />
                      <Input value={bgColor} onChange={e => setBgColor(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-3 rounded-xl mt-4">
                    SALVAR AJUSTES VISUAIS
                  </Button>
                </div>

                <div className="border border-border rounded-2xl p-6 bg-muted/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Pré-visualização do Contraste</h3>
                    <div className="border border-border rounded-xl p-6 shadow-md" style={{ backgroundColor: bgColor }}>
                      <h4 className="font-heading text-lg font-bold" style={{ color: primaryColor }}>MAEUM GLOBAL</h4>
                      <p className="text-xs leading-relaxed mt-2" style={{ color: secondaryColor }}>
                        A combinação de tipografia elegante e espaçamento largo traz um ar contemporâneo e sofisticado de agência de turismo premium.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PAGE BUILDER */}
          {activeSubTab === 'builder' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Page Builder - Blocos da Página Inicial</h2>
              
              <div className="flex flex-col gap-4">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => moveBlock(idx, 'up')} className="text-muted-foreground hover:text-primary"><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={() => moveBlock(idx, 'down')} className="text-muted-foreground hover:text-primary"><ArrowDown className="h-4 w-4" /></button>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-secondary">{block.section_id.toUpperCase()} SECTION</h4>
                        <span className="text-[10px] text-muted-foreground uppercase">{block.block_type} Block • Ordem: {idx + 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleBlockActive(idx)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                          block.active
                            ? 'bg-green-55 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {block.active ? 'Ativo' : 'Desativado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EXPERIÊNCIAS COREIA */}
          {activeSubTab === 'experiencias' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="font-heading text-xl font-light text-secondary mb-6 border-b border-border pb-3">Nova Experiência</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!expTitle || !expPrice) return;
                  const all = db.get('experiences');
                  const newExp = {
                    id: crypto.randomUUID(), slug: expSlug || expTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    title: expTitle, subtitle: '', location: expLocation || 'Seul', region: 'Seul', city: 'Seul',
                    category_slugs: expCategory ? [expCategory] : [],
                    description: expDescription || 'Nova experiência cadastrada pelo painel.',
                    highlights: [], included: [],
                    duration_hours: Number(expDuration) || 2, price_per_person: Number(expPrice),
                    main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800',
                    gallery: [], video_url: '', video_embed: '',
                    status: 'active', booking_type: expBookingType, available_from: '2026-08-25',
                    created_at: new Date().toISOString()
                  };
                  all.push(newExp);
                  db.save('experiences', all);
                  setExpTitle(''); setExpSlug(''); setExpPrice(0); setExpDuration(0); setExpLocation(''); setExpDescription('');
                  loadData();
                  toast('Experiência adicionada com sucesso!');
                }} className="flex flex-col gap-4 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Título</label>
                    <Input required value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="Ex: Seul Depois do Pôr do Sol" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Slug (URL)</label>
                    <Input value={expSlug} onChange={e => setExpSlug(e.target.value)} placeholder="seul-depois-do-por-do-sol" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Preço (R$)</label>
                      <Input required type="number" value={expPrice || ''} onChange={e => setExpPrice(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Duração (horas)</label>
                      <Input type="number" value={expDuration || ''} onChange={e => setExpDuration(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Categoria</label>
                    <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Selecionar</option>
                      {categories.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Tipo de Reserva</label>
                    <select value={expBookingType} onChange={e => setExpBookingType(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <option value="direct">Reserva Direta</option>
                      <option value="request">Solicitar Reserva</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Localização</label>
                    <Input value={expLocation} onChange={e => setExpLocation(e.target.value)} placeholder="Ex: Gangnam, Seul" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Descrição</label>
                    <textarea value={expDescription} onChange={e => setExpDescription(e.target.value)} className="flex h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl">
                    ADICIONAR EXPERIÊNCIA
                  </Button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
                  <h3 className="font-heading text-xl font-light text-secondary">Experiências Cadastradas ({experiences.length})</h3>
                  <select value={experienceFilter} onChange={e => setExperienceFilter(e.target.value)} className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background">
                    <option value="all">Todas</option>
                    <option value="direct">Reserva Direta</option>
                    <option value="request">Solicitar Reserva</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  {(experienceFilter === 'all' ? experiences : experiences.filter((e: any) => e.booking_type === experienceFilter)).map((exp: any) => (
                    <div key={exp.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={exp.main_image} alt={exp.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-secondary">{exp.title}</h4>
                          <span className="text-[10px] text-muted-foreground uppercase">{exp.location} • {exp.duration_hours}h • R$ {exp.price_per_person}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${exp.booking_type === 'direct' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {exp.booking_type === 'direct' ? 'Reserva Direta' : 'Solicitar'}
                        </span>
                        <button onClick={() => { const filtered = experiences.filter((e: any) => e.id !== exp.id); db.save('experiences', filtered); loadData(); toast('Experiência removida.'); }} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: K-BEAUTY */}
          {activeSubTab === 'kbeauty' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Gerenciar K-Beauty Experiences</h2>
              <div className="flex flex-col gap-4">
                {kbeautyExperiences.map((exp: any) => (
                  <div key={exp.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-secondary">{exp.title}</h4>
                      <span className="text-[10px] text-muted-foreground uppercase">{exp.location} • R$ {exp.price_per_person}/pessoa</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Ativo</span>
                      <button onClick={() => { const filtered = kbeautyExperiences.filter((e: any) => e.id !== exp.id); db.save('kbeauty_experiences', filtered); loadData(); toast('Experiência K-Beauty removida.'); }} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-2">Novas experiências K-Beauty de empresas parceiras serão adicionadas conforme a cliente enviar as informações.</p>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIAS */}
          {activeSubTab === 'categorias' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Categorias de Experiências</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-muted/10 border border-border rounded-2xl p-6 h-fit text-xs flex flex-col gap-4">
                  <h3 className="font-bold text-secondary uppercase tracking-wider">Nova Categoria</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!catName) return;
                    const all = db.get('categories');
                    const newCat = { id: crypto.randomUUID(), slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: catName, destination: 'Coreia do Sul', active: true, sort_order: all.length };
                    all.push(newCat);
                    db.save('categories', all);
                    setCatName(''); setCatSlug('');
                    loadData();
                    toast('Categoria adicionada!');
                  }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Nome</label>
                      <Input required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex: História e Cultura" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Slug</label>
                      <Input value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="historia-e-cultura" />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2 rounded-xl">ADICIONAR</Button>
                  </form>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-3">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-bold text-secondary">{cat.name}</h4>
                        <span className="text-[10px] text-muted-foreground">/{cat.slug} • Ordem: {cat.sort_order}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full ${cat.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {cat.active ? 'Ativa' : 'Inativa'}
                        </span>
                        <button onClick={() => { const filtered = categories.filter((c: any) => c.id !== cat.id); db.save('categories', filtered); loadData(); toast('Categoria removida.'); }} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: INTERCÂMBIO */}
          {activeSubTab === 'intercambio' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Gerenciar Intercâmbio — Lexis Korea</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Campus Cadastrados</h3>
                  {campuses.map((campus: any) => (
                    <div key={campus.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 mb-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-bold text-secondary">{campus.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{campus.location}</span>
                      </div>
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Ativo</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Programas</h3>
                  {(db.get('exchange_programs') || []).map((prog: any) => (
                    <div key={prog.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 mb-3 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-secondary">{prog.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{prog.classes_per_week} aulas/semana</span>
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        {prog.pricing_tiers.map((tier: any, i: number) => (
                          <span key={i} className="mr-3">{tier.range} sem: KRW {tier.price_per_week.toLocaleString()}/sem</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: JORNADAS */}
          {activeSubTab === 'jornadas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="font-heading text-xl font-light text-secondary mb-6 border-b border-border pb-3">Nova Jornada</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!journeyTitle || !journeyPrice) return;
                  const all = db.get('journeys');
                  const newJourney = {
                    id: crypto.randomUUID(), slug: journeyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    title: journeyTitle, subtitle: '', concept: '', destinations: ['Seul'],
                    duration_days: Number(journeyDuration) || 10, total_spots: 15,
                    accommodation: 'Hotel 4 estrelas', price_per_person: Number(journeyPrice), price_currency: 'BRL',
                    main_image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800',
                    gallery: [], video_url: '', video_embed: '',
                    included: [], not_included: [], itinerary: [], highlights: [],
                    payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 },
                    status: 'active', category: 'premium', created_at: new Date().toISOString()
                  };
                  all.push(newJourney);
                  db.save('journeys', all);
                  setJourneyTitle(''); setJourneyPrice(0); setJourneyDuration(0);
                  loadData();
                  toast('Jornada criada com sucesso!');
                }} className="flex flex-col gap-4 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Título</label>
                    <Input required value={journeyTitle} onChange={e => setJourneyTitle(e.target.value)} placeholder="Ex: Cheotnun — A Magia da Primeira Neve" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Preço (R$)</label>
                      <Input required type="number" value={journeyPrice || ''} onChange={e => setJourneyPrice(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Duração (dias)</label>
                      <Input type="number" value={journeyDuration || ''} onChange={e => setJourneyDuration(Number(e.target.value))} />
                    </div>
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl">CRIAR JORNADA</Button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading text-xl font-light text-secondary mb-6 border-b border-border pb-3">Jornadas Cadastradas ({journeys.length})</h3>
                <div className="flex flex-col gap-3">
                  {journeys.map((jour: any) => (
                    <div key={jour.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-secondary">{jour.title}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase">{jour.duration_days} dias • R$ {jour.price_per_person.toLocaleString()}/pessoa</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border ${jour.category === 'army' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {jour.category === 'army' ? 'ARMY' : 'Premium'}
                        </span>
                        <button onClick={() => { const filtered = journeys.filter((j: any) => j.id !== jour.id); db.save('journeys', filtered); loadData(); toast('Jornada removida.'); }} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CRUD PACKAGES, EXCHANGES, EXPERIENCES */}
          {activeSubTab === 'packages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="font-heading text-xl font-light text-secondary mb-6 border-b border-border pb-3">Novo Item</h3>
                <form onSubmit={handleCreatePackage} className="flex flex-col gap-4 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Título do Item</label>
                    <Input required value={pkgTitle} onChange={e => setPkgTitle(e.target.value)} placeholder="Ex: Intercâmbio de Skincare em Seul" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Tipo</label>
                    <select value={pkgType} onChange={e => setPkgType(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-secondary">
                      <option value="package">Pacote Turístico</option>
                      <option value="exchange">Intercâmbio de Estudos</option>
                      <option value="experience">Experiência Temática</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Destino</label>
                    <select value={pkgDestination} onChange={e => setPkgDestination(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-secondary">
                      <option value="Coreia do Sul">Coreia do Sul</option>
                      <option value="Japão">Japão</option>
                      <option value="Vietnã">Vietnã</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Preço (USD)</label>
                    <Input required type="number" value={pkgPrice || ''} onChange={e => setPkgPrice(Number(e.target.value))} placeholder="0.00" />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl">
                    ADICIONAR ITEM
                  </Button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-heading text-xl font-light text-secondary mb-6 border-b border-border pb-3">Itens Cadastrados</h3>
                <div className="flex flex-col gap-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-secondary">{pkg.title}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase">{pkg.destination} • Tipo: {pkg.type === 'package' ? 'Pacote' : pkg.type === 'exchange' ? 'Intercâmbio' : 'Experiência'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-primary">US$ {pkg.price.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LEADS & NEWSLETTERS */}
          {activeSubTab === 'leads' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                <h2 className="font-heading text-2xl font-light text-secondary">Gestão de Leads & E-mail Marketing</h2>
                <Button className="bg-primary text-white text-xs rounded-xl font-bold px-4 py-2">
                  <Share2 className="h-4 w-4 mr-2" />
                  EXPORTAR MAILING
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Formulários de Orçamento Recebidos</h3>
                  {leads.map((lead) => (
                    <div key={lead.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-bold text-secondary">{lead.name}</h4>
                        <p className="text-muted-foreground">{lead.email} • {lead.phone}</p>
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 mt-2 inline-block">
                          Interesse: {lead.interest_destination}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Integration Info */}
                <div className="border border-border rounded-2xl p-6 bg-muted/10 h-fit">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Newsletter Subscriptions</h3>
                  <div className="flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
                    <p>Clientes cadastrados dinamicamente para campanhas de e-mail marketing:</p>
                    <div className="bg-white border border-border p-3 rounded-lg flex flex-col gap-1.5 font-mono text-[10px]">
                      <div>✓ cliente@maeum.com (Bruno Almeida)</div>
                      <div>✓ contato@intercambio.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BLOG ARTICLES */}
          {activeSubTab === 'blog' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Artigos do Blog Corporativo</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-muted/10 border border-border rounded-2xl p-6 h-fit text-xs text-muted-foreground flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Novo Artigo</h3>
                  <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Título do Artigo</label>
                      <Input required value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="Ex: Viagem cultural em Quioto" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Autor</label>
                      <Input value={newPostAuthor} onChange={e => setNewPostAuthor(e.target.value)} placeholder="Ex: Mariana Santos" />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2 rounded-xl">
                      PUBLICAR ARTIGO
                    </Button>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Artículos Publicados</h3>
                  {blogPosts.map((post) => (
                    <div key={post.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-bold text-secondary">{post.title}</h4>
                        <span className="text-[10px] text-muted-foreground">Autor: {post.author} • Publicado: {post.created_at}</span>
                      </div>
                      <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SITE CONFIG (Brand, Contact, Social, SEO, Legal) */}
          {activeSubTab === 'siteconfig' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Configurações Completas do Site</h2>

              {configSaved && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 mb-6">
                  ✓ Configurações salvas com sucesso!
                </div>
              )}

              <form onSubmit={handleSaveSiteConfig} className="flex flex-col gap-8 text-xs text-muted-foreground">

                {/* Brand Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Settings className="h-4.5 w-4.5 text-primary" />
                      Informações da Marca
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Nome do Site</label>
                      <Input value={siteConfig?.brand?.name || ''} onChange={e => updateSiteConfig('brand', 'name', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Tagline</label>
                      <Input value={siteConfig?.brand?.tagline || ''} onChange={e => updateSiteConfig('brand', 'tagline', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">URL do Logo (Header)</label>
                      <Input value={siteConfig?.brand?.logo_url || ''} onChange={e => updateSiteConfig('brand', 'logo_url', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Favicon URL</label>
                      <Input value={siteConfig?.brand?.favicon_url || ''} onChange={e => updateSiteConfig('brand', 'favicon_url', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Footer Logo URL</label>
                      <Input value={siteConfig?.brand?.footer_logo_url || ''} onChange={e => updateSiteConfig('brand', 'footer_logo_url', e.target.value)} />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Mail className="h-4.5 w-4.5 text-primary" />
                      Informações de Contato
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">E-mail Principal</label>
                      <Input value={siteConfig?.contact?.email || ''} onChange={e => updateSiteConfig('contact', 'email', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">E-mail de Vendas</label>
                      <Input value={siteConfig?.contact?.sales_email || ''} onChange={e => updateSiteConfig('contact', 'sales_email', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Telefone</label>
                      <Input value={siteConfig?.contact?.phone || ''} onChange={e => updateSiteConfig('contact', 'phone', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">WhatsApp</label>
                      <Input value={siteConfig?.contact?.whatsapp || ''} onChange={e => updateSiteConfig('contact', 'whatsapp', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Endereço (Sede)</label>
                      <Input value={siteConfig?.contact?.address || ''} onChange={e => updateSiteConfig('contact', 'address', e.target.value)} />
                    </div>
                  </div>

                  {/* Social */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Share2 className="h-4.5 w-4.5 text-primary" />
                      Redes Sociais
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Instagram</label>
                      <Input value={siteConfig?.social?.instagram || ''} onChange={e => updateSiteConfig('social', 'instagram', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Facebook</label>
                      <Input value={siteConfig?.social?.facebook || ''} onChange={e => updateSiteConfig('social', 'facebook', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">YouTube</label>
                      <Input value={siteConfig?.social?.youtube || ''} onChange={e => updateSiteConfig('social', 'youtube', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">LinkedIn</label>
                      <Input value={siteConfig?.social?.linkedin || ''} onChange={e => updateSiteConfig('social', 'linkedin', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">TikTok</label>
                      <Input value={siteConfig?.social?.tiktok || ''} onChange={e => updateSiteConfig('social', 'tiktok', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* SEO & SMTP & Integrations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Globe className="h-4.5 w-4.5 text-primary" />
                      SEO & Analytics
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Sufixo de Títulos</label>
                      <Input value={siteConfig?.seo?.title_suffix || ''} onChange={e => updateSiteConfig('seo', 'title_suffix', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Meta Descrição Padrão</label>
                      <textarea className="w-full border border-border rounded-xl p-3 text-xs bg-white resize-none h-20" value={siteConfig?.seo?.meta_description || ''} onChange={e => updateSiteConfig('seo', 'meta_description', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Google Analytics ID</label>
                      <Input value={siteConfig?.seo?.google_analytics || ''} onChange={e => updateSiteConfig('seo', 'google_analytics', e.target.value)} placeholder="G-XXXXXXXXXX" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Google Tag Manager ID</label>
                      <Input value={siteConfig?.seo?.google_tag_manager || ''} onChange={e => updateSiteConfig('seo', 'google_tag_manager', e.target.value)} placeholder="GTM-XXXXXXX" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Meta Pixel ID</label>
                      <Input value={siteConfig?.seo?.meta_pixel || ''} onChange={e => updateSiteConfig('seo', 'meta_pixel', e.target.value)} placeholder="1234567890" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Send className="h-4.5 w-4.5 text-primary" />
                      SMTP & Notificações
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Host SMTP</label>
                      <Input value={siteConfig?.smtp?.host || ''} onChange={e => updateSiteConfig('smtp', 'host', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Porta SMTP</label>
                      <Input value={siteConfig?.smtp?.port?.toString() || '587'} onChange={e => updateSiteConfig('smtp', 'port', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Usuário SMTP</label>
                      <Input value={siteConfig?.smtp?.user || ''} onChange={e => updateSiteConfig('smtp', 'user', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Senha SMTP</label>
                      <Input type="password" value={siteConfig?.smtp?.password || ''} onChange={e => updateSiteConfig('smtp', 'password', e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">E-mail de Notificação (admin)</label>
                      <Input value={siteConfig?.smtp?.admin_email || ''} onChange={e => updateSiteConfig('smtp', 'admin_email', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Key className="h-4.5 w-4.5 text-primary" />
                      Integrações & APIs
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Stripe API Public Key</label>
                      <Input value={siteConfig?.integrations?.stripe_pk || ''} onChange={e => updateSiteConfig('integrations', 'stripe_pk', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Stripe API Secret Key</label>
                      <Input type="password" value={siteConfig?.integrations?.stripe_sk || ''} onChange={e => updateSiteConfig('integrations', 'stripe_sk', e.target.value)} placeholder="sk_live_..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">SendGrid API Key</label>
                      <Input type="password" value={siteConfig?.integrations?.sendgrid_key || ''} onChange={e => updateSiteConfig('integrations', 'sendgrid_key', e.target.value)} placeholder="SG.xxxxx" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Recaptcha Site Key</label>
                      <Input value={siteConfig?.integrations?.recaptcha_key || ''} onChange={e => updateSiteConfig('integrations', 'recaptcha_key', e.target.value)} placeholder="6Lc..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Mapbox Token (Mapas)</label>
                      <Input value={siteConfig?.integrations?.mapbox_token || ''} onChange={e => updateSiteConfig('integrations', 'mapbox_token', e.target.value)} placeholder="pk.ey..." />
                    </div>
                  </div>
                </div>

                {/* Legal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Shield className="h-4.5 w-4.5 text-primary" />
                      Informações Legais
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">CNPJ</label>
                      <Input value={siteConfig?.legal?.cnpj || ''} onChange={e => updateSiteConfig('legal', 'cnpj', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Razão Social</label>
                      <Input value={siteConfig?.legal?.company_name || ''} onChange={e => updateSiteConfig('legal', 'company_name', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Política de Privacidade (URL)</label>
                      <Input value={siteConfig?.legal?.privacy_url || ''} onChange={e => updateSiteConfig('legal', 'privacy_url', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Termos de Uso (URL)</label>
                      <Input value={siteConfig?.legal?.terms_url || ''} onChange={e => updateSiteConfig('legal', 'terms_url', e.target.value)} />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end gap-2 pt-4">
                    <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl px-8">
                      SALVAR TODAS AS CONFIGURAÇÕES
                    </Button>
                    <Button variant="outline" type="button" onClick={() => toast('Backup exportado com sucesso!')} className="border-border text-secondary hover:bg-muted/10 py-2.5 rounded-xl">
                      DOWNLOAD BACKUP
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: NAVIGATION MANAGER */}
          {activeSubTab === 'navigation' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Gerenciador de Navegação</h2>
              <p className="text-xs text-muted-foreground mb-6">Personalize os menus do site: adicione, remova ou reordene itens.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Header Navigation */}
                <div className="border border-border rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Menu do Header (Principal)</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Início', href: '/' },
                      { label: 'Destinos', href: '/destinos' },
                      { label: 'Coreia do Sul', href: '/coreia-do-sul' },
                      { label: 'Jornadas', href: '/coreia-do-sul/jornadas' },
                      { label: 'Intercâmbio', href: '/coreia-do-sul/intercambio' },
                      { label: 'Blog', href: '/blog' },
                      { label: 'Contato', href: '/contato' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-border/60 rounded-lg p-3 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-[10px] font-mono w-6">{idx + 1}</span>
                          <span className="text-xs font-semibold text-secondary">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.href}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-muted-foreground hover:text-secondary"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-muted-foreground hover:text-secondary"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Input placeholder="Rótulo do menu" className="text-xs h-9" />
                    <Input placeholder="/link" className="text-xs h-9 flex-1" />
                    <Button size="sm" className="bg-primary hover:bg-accent-hover text-white h-9 px-3 rounded-lg text-xs">+</Button>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="border border-border rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Menu do Footer</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Sobre Nós', href: '/sobre' },
                      { label: 'Coreia do Sul', href: '/coreia-do-sul' },
                      { label: 'Experiências', href: '/coreia-do-sul/experiencias' },
                      { label: 'K-Beauty', href: '/coreia-do-sul/k-beauty' },
                      { label: 'Jornadas em Grupo', href: '/coreia-do-sul/jornadas' },
                      { label: 'Intercâmbio', href: '/coreia-do-sul/intercambio' },
                      { label: 'Blog', href: '/blog' },
                      { label: 'Contato', href: '/contato' },
                      { label: 'Política de Privacidade', href: '/privacidade' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-border/60 rounded-lg p-3 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-[10px] font-mono w-6">{idx + 1}</span>
                          <span className="text-xs font-semibold text-secondary">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.href}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-muted-foreground hover:text-secondary"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-muted-foreground hover:text-secondary"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CMS PAGES */}
          {activeSubTab === 'cmspages' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h2 className="font-heading text-2xl font-light text-secondary">Páginas CMS</h2>
                <Button className="bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-4">
                  <Plus className="h-4 w-4 mr-1" /> Nova Página
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { title: 'Sobre Nós', slug: 'sobre', status: 'published', updated: '15/07/2026' },
                  { title: 'Política de Privacidade', slug: 'privacidade', status: 'published', updated: '10/07/2026' },
                  { title: 'Termos de Uso', slug: 'termos', status: 'published', updated: '10/07/2026' },
                  { title: 'Contato', slug: 'contato', status: 'published', updated: '08/07/2026' },
                  { title: 'FAQ', slug: 'faq', status: 'draft', updated: '12/07/2026' }
                ].map((page, idx) => (
                  <div key={idx} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-bold text-secondary">{page.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">/{page.slug} • Atualizado: {page.updated}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${page.status === 'published' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                        {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                      <button className="p-1.5 text-muted-foreground hover:text-secondary"><Edit3 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-muted/10 border border-border rounded-2xl p-6">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Criar Nova Página CMS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Título da Página</label>
                    <Input placeholder="Ex: Equipe Maeum" className="text-xs h-9" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Slug (URL)</label>
                    <Input placeholder="equipe" className="text-xs h-9" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Status</label>
                    <select className="border border-border rounded-xl p-2 text-xs bg-white h-9">
                      <option>Rascunho</option>
                      <option>Publicado</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-xs font-semibold text-secondary">Conteúdo (Markdown / HTML)</label>
                  <textarea className="w-full border border-border rounded-xl p-3 text-xs bg-white resize-none h-32" placeholder="Digite o conteúdo da página..." />
                </div>
                <Button className="mt-4 bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-6">
                  CRIAR PÁGINA
                </Button>
              </div>
            </div>
          )}

          {/* TAB: TESTIMONIALS */}
          {activeSubTab === 'testimonials' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h2 className="font-heading text-2xl font-light text-secondary">Depoimentos</h2>
                <Button className="bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-4">
                  <Plus className="h-4 w-4 mr-1" /> Novo Depoimento
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { name: 'Ana Beatriz', destination: 'Coreia do Sul - 2026', text: 'A Maeum tornou meu intercâmbio inesquecível. Cada detalhe foi pensado com carinho e profissionalismo. Recomendo de olhos fechados!', rating: 5, status: 'approved' },
                  { name: 'Lucas Mendes', destination: 'Experiência K-Beauty', text: 'O roteiro de beleza coreana superou todas as expectativas. Clínicas incríveis e acompanhamento impecável.', rating: 5, status: 'approved' },
                  { name: 'Carla Oliveira', destination: 'Jornada Essência da Coreia', text: 'Viajar em grupo com a Maeum foi uma experiência transformadora. Cultura, gastronomia e conexões verdadeiras.', rating: 4, status: 'pending' },
                  { name: 'Rafael Costa', destination: 'Intercâmbio Lexis Korea', text: 'Escolhi a Lexis Korea através da Maeum e foi a melhor decisão. O suporte antes, durante e depois é sensacional.', rating: 5, status: 'approved' }
                ].map((t, idx) => (
                  <div key={idx} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-secondary">{t.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{t.destination}</span>
                        <div className="flex items-center">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <span key={i} className="text-yellow-500 text-xs">★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${t.status === 'approved' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                        {t.status === 'approved' ? 'Aprovado' : 'Pendente'}
                      </span>
                      <button className="p-1.5 text-muted-foreground hover:text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                      <button className="p-1.5 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-muted/10 border border-border rounded-2xl p-6">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Adicionar Depoimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Nome do Cliente</label>
                    <Input placeholder="Nome completo" className="text-xs h-9" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Destino / Experiência</label>
                    <Input placeholder="Ex: Jornada Essência da Coreia" className="text-xs h-9" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Avaliação (1-5)</label>
                    <select className="border border-border rounded-xl p-2 text-xs bg-white h-9">
                      <option>5</option>
                      <option>4</option>
                      <option>3</option>
                      <option>2</option>
                      <option>1</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-xs font-semibold text-secondary">Depoimento</label>
                  <textarea className="w-full border border-border rounded-xl p-3 text-xs bg-white resize-none h-24" placeholder="Escreva o depoimento do cliente..." />
                </div>
                <Button className="mt-4 bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-6">
                  ADICIONAR DEPOIMENTO
                </Button>
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeSubTab === 'faq' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h2 className="font-heading text-2xl font-light text-secondary">Perguntas Frequentes (FAQ)</h2>
                <Button className="bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-4">
                  <Plus className="h-4 w-4 mr-1" /> Nova Pergunta
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { question: 'Quanto tempo antes devo reservar minha viagem?', answer: 'Recomendamos reservar com pelo menos 3 meses de antecedência para garantir disponibilidade e melhores tarifas.', category: 'Geral', order: 1 },
                  { question: 'A Maeum oferece suporte durante a viagem?', answer: 'Sim! Oferecemos suporte 24/7 via WhatsApp para todos os viajantes durante toda a experiência.', category: 'Geral', order: 2 },
                  { question: 'Quais documentos preciso para viajar para a Coreia do Sul?', answer: 'Brasileiros necessitam de passaporte com validade mínima de 6 meses e visto K-ETA para turismo.', category: 'Coreia do Sul', order: 3 },
                  { question: 'Os programas de intercâmbio incluem acomodação?', answer: 'Sim, todos os programas de intercâmbio incluem acomodação, seguro saúde e suporte local.', category: 'Intercâmbio', order: 4 },
                  { question: 'Como funcionam os pagamentos?', answer: 'Aceitamos PIX, transferência bancária e cartões internacionais. Parcelamos em até 12x.', category: 'Pagamentos', order: 5 },
                  { question: 'Posso personalizar um roteiro?', answer: 'Sim, todos os nossos roteiros são 100% personalizáveis de acordo com seus interesses e orçamento.', category: 'Geral', order: 6 }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-border/80 rounded-xl p-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground font-mono">#{faq.order}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">{faq.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-secondary">{faq.question}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button className="p-1.5 text-muted-foreground hover:text-secondary"><Edit3 className="h-4 w-4" /></button>
                        <button className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-muted/10 border border-border rounded-2xl p-6">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Nova Pergunta Frequente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Pergunta</label>
                    <Input placeholder="Digite a pergunta" className="text-xs h-9" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Categoria</label>
                    <select className="border border-border rounded-xl p-2 text-xs bg-white h-9">
                      <option>Geral</option>
                      <option>Coreia do Sul</option>
                      <option>Intercâmbio</option>
                      <option>Pagamentos</option>
                      <option>Jornadas</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Ordem</label>
                    <Input type="number" placeholder="1" className="text-xs h-9" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-xs font-semibold text-secondary">Resposta</label>
                  <textarea className="w-full border border-border rounded-xl p-3 text-xs bg-white resize-none h-24" placeholder="Digite a resposta detalhada..." />
                </div>
                <Button className="mt-4 bg-primary hover:bg-accent-hover text-white text-xs rounded-xl h-9 px-6">
                  ADICIONAR FAQ
                </Button>
              </div>
            </div>
          )}

          {/* TAB: METRICS */}
          {activeSubTab === 'stats' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Métricas Gerais e CRM</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Total Faturado', value: 'US$ 14,200', icon: DollarSign, change: '+12% este mês' },
                  { title: 'Propostas Enviadas', value: '5 Ativas', icon: FileText, change: '3 pendentes de aceite' },
                  { title: 'Leads Captados', value: '18 Leads', icon: Briefcase, change: 'Conversão de 25%' },
                  { title: 'Taxa de Retenção', value: '98.5%', icon: Award, change: 'Satisfação Nível Luxo' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="border border-border/80 bg-muted/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{stat.title}</span>
                          <h4 className="font-heading text-2xl font-semibold text-secondary mt-1">{stat.value}</h4>
                        </div>
                        <span className="p-2 bg-primary/10 rounded-xl text-primary"><Icon className="h-5 w-5" /></span>
                      </div>
                      <span className="text-[10px] text-green-600 font-semibold mt-4">{stat.change}</span>
                    </div>
                  );
                })}
              </div>

              {/* CRM Propostas tracker */}
              <div className="border border-border rounded-2xl p-6 bg-muted/10">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Acompanhamento de Propostas Online</h3>
                <div className="flex flex-col gap-3">
                  {proposals.map((prop) => (
                    <div key={prop.id} className="border border-border bg-white rounded-xl p-4 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-secondary">{prop.title}</h4>
                        <p className="text-muted-foreground mt-0.5">Link Único: `/proposta/{prop.unique_link}`</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-primary">US$ {prop.total_amount.toLocaleString()}</span>
                        <span className="px-3 py-1 rounded-full font-bold uppercase text-blue-700 bg-blue-50 border border-blue-100">{prop.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS & PERMISSIONS */}
          {activeSubTab === 'users' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Controle de Usuários e Perfis Administrativos</h2>
              
              <div className="flex flex-col gap-4">
                {usersList.map((user) => (
                  <div key={user.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-secondary">{user.name}</h4>
                      <span className="text-[10px] text-muted-foreground uppercase">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase border border-primary/20 text-primary bg-primary/10">
                        {user.role}
                      </span>
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-150">Ativo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
