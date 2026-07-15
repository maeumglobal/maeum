'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Palette, Layers, Folder, Database, Users, Shield,
  CheckCircle2, Plus, Trash2, ArrowUp, ArrowDown, Edit3, Info,
  TrendingUp, DollarSign, Briefcase, FileText, Send, Share2, Award,
  BookOpen, Globe, Mail, Key
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/db';

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('visual');
  const { theme, updateTheme } = useTheme();

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

  // CRUD Package/Exchange/Experience States
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgType, setPkgType] = useState('package'); // package, exchange, experience
  const [pkgDestination, setPkgDestination] = useState('Coreia do Sul');

  // Blog State
  const [blogPosts, setBlogPosts] = useState<any[]>([
    { id: '1', title: 'Como Planejar sua Viagem de Luxo a Seul', author: 'Mariana Santos', created_at: '2026-07-08' },
    { id: '2', title: 'Top 5 Templos Tradicionais em Quioto', author: 'Bruno Almeida', created_at: '2026-07-09' }
  ]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostAuthor, setNewPostAuthor] = useState('');

  // SEO & General Settings
  const [seoTitleSuffix, setSeoTitleSuffix] = useState('| Maeum Global Travel');
  const [seoDescription, setSeoDescription] = useState('Descubra roteiros de luxo exclusivos, intercâmbios e experiências na Ásia.');
  const [smtpServer, setSmtpServer] = useState('smtp.sendgrid.net');
  const [smtpUser, setSmtpUser] = useState('no-reply@maeumglobal.com');
  const [stripeKey, setStripeKey] = useState('pk_live_51M3c...');
  const [configSaved, setConfigSaved] = useState(false);

  const loadData = () => {
    setBlocks(db.get('cms_blocks') || []);
    setPackages(db.get('packages') || []);
    setLeads(db.get('crm_leads') || []);
    setProposals(db.get('proposals') || []);
    setUsersList(db.get('users') || []);
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
  };

  // CRUD Delete Item
  const handleDeletePackage = (id: string) => {
    const allPkgs = db.get('packages');
    const filtered = allPkgs.filter((p: any) => p.id !== id);
    db.save('packages', filtered);
    loadData();
  };

  // Create Blog Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle) return;
    const newP = {
      id: crypto.randomUUID(),
      title: newPostTitle,
      author: newPostAuthor || 'Maeum Editor',
      created_at: new Date().toISOString().split('T')[0]
    };
    setBlogPosts([...blogPosts, newP]);
    setNewPostTitle('');
    setNewPostAuthor('');
  };

  const handleDeletePost = (id: string) => {
    setBlogPosts(blogPosts.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-4 md:px-8">
        <div className="flex items-center gap-4 border-b border-border pb-6 mb-8">
          <span className="p-3 bg-primary/10 rounded-2xl">
            <Settings className="h-6 w-6 text-primary" />
          </span>
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">CMS & CRM Enterprise</span>
            <h1 className="font-heading text-3xl font-light text-secondary uppercase">Painel de Controle Maeum Global</h1>
          </div>
        </div>

        {/* Tab Selection Area */}
        <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto pb-2">
          {[
            { id: 'visual', label: 'Identidade Visual', icon: Palette },
            { id: 'builder', label: 'Page Builder (Blocos)', icon: Layers },
            { id: 'packages', label: 'Pacotes & Experiências', icon: Database },
            { id: 'leads', label: 'Leads & E-mail Marketing', icon: Folder },
            { id: 'blog', label: 'Artigos do Blog', icon: BookOpen },
            { id: 'settings', label: 'Configurações & SEO', icon: Globe },
            { id: 'stats', label: 'Estatísticas & CRM', icon: TrendingUp },
            { id: 'users', label: 'Consultoras & Permissões', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all min-w-max ${
                  activeSubTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
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

          {/* TAB: GENERAL SETTINGS, SMTP & SEO */}
          {activeSubTab === 'settings' && (
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Configuração do Sistema, SMTP & SEO</h2>
              
              {configSaved && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 mb-6">
                  ✓ Configurações de SEO, APIs e SMTP salvas com sucesso!
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setConfigSaved(true);
                setTimeout(() => setConfigSaved(false), 3000);
              }} className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-muted-foreground">
                <div className="flex flex-col gap-5">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                    <Globe className="h-4.5 w-4.5 text-primary" />
                    Configurações de SEO & Sitemap
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Sufixo de Títulos SEO</label>
                    <Input value={seoTitleSuffix} onChange={e => setSeoTitleSuffix(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Meta Descrição Padrão</label>
                    <Input value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
                  </div>

                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2 mt-4">
                    <Mail className="h-4.5 w-4.5 text-primary" />
                    Servidor SMTP de Notificações
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Host SMTP</label>
                    <Input value={smtpServer} onChange={e => setSmtpServer(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Usuário SMTP</label>
                    <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                    <Key className="h-4.5 w-4.5 text-primary" />
                    Integrações de APIs & Gateways
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Stripe API Public Key</label>
                    <Input value={stripeKey} onChange={e => setStripeKey(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Google Analytics ID</label>
                    <Input placeholder="G-XXXXXXXXXX" />
                  </div>

                  <div className="mt-8 pt-4 border-t border-border flex flex-col gap-2">
                    <Button type="submit" className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl">
                      SALVAR CONFIGURAÇÕES
                    </Button>
                    <Button variant="outline" type="button" onClick={() => alert('¡Generando copia de seguridad de la base de datos!')} className="border-border text-secondary hover:bg-muted/10 py-2.5 rounded-xl">
                      DESCARREGAR BACKUP COMPLETO (SQL/JSON)
                    </Button>
                  </div>
                </div>
              </form>
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

      <Footer />
    </div>
  );
}
