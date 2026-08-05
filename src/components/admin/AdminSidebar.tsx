'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, ClipboardList, User, Package, CalendarCheck, 
  CreditCard, Compass, Users, FileText, UserCog, Settings, LogOut, ChevronDown, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { id: 'dashboard_home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'CRM / Leads', icon: ClipboardList },
    { id: 'users', label: 'Clientes e Equipe', icon: UserCog },
    { id: 'reservas', label: 'Reservas', icon: CalendarCheck },
    { 
      id: 'produtos', label: 'Produtos', icon: Package,
      subItems: [
        { id: 'jornadas', label: 'Jornadas (Pacotes)' },
        { id: 'experiencias', label: 'Experiências' },
        { id: 'categorias', label: 'Categorias' }
      ]
    },
    { 
      id: 'cms', label: 'Conteúdo (CMS)', icon: FileText,
      subItems: [
        { id: 'blog', label: 'Blog & Artigos' },
        { id: 'depoimentos_faq', label: 'Depoimentos & FAQ' }
      ]
    },
    { id: 'logs', label: 'Auditoria de Logs', icon: Activity },
    { id: 'visual', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="w-[280px] h-screen bg-[var(--admin-bg)] border-r border-[var(--admin-border)] flex flex-col shrink-0 font-sans">
      <div className="p-6 pb-2">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 mb-3 text-[var(--admin-primary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 22h20L12 2z" />
              <path d="M12 12l-5 8h10l-5-8z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-[var(--admin-primary)] font-bold tracking-widest text-sm mb-1 uppercase">Maeum</h1>
            <h2 className="text-[var(--admin-primary)] font-light tracking-[0.2em] text-[10px] mb-2 uppercase">Global</h2>
            <div className="bg-[var(--admin-accent-red)] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Admin Pro</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        <nav className="flex flex-col gap-1.5">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));
              const isExpanded = expandedMenus[item.id] || isActive;
              
              return (
                <li key={item.id} className="flex flex-col">
                  <button
                    onClick={() => {
                      if (item.subItems) {
                        toggleMenu(item.id);
                      } else {
                        onTabChange(item.id);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive && !item.subItems
                        ? 'bg-[var(--admin-border)] text-[var(--admin-text-main)]' 
                        : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]/50 hover:text-[var(--admin-text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive && !item.subItems ? 'text-[var(--admin-primary)]' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.subItems && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {item.subItems && isExpanded && (
                      <motion.ul 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col gap-1 mt-1 pl-9"
                      >
                        {item.subItems.map(sub => (
                          <li key={sub.id}>
                            <button
                              onClick={() => onTabChange(sub.id)}
                              className={`w-full text-left py-1.5 text-xs transition-colors ${
                                activeTab === sub.id ? 'text-[var(--admin-primary)] font-semibold' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                              }`}
                            >
                              {sub.label}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--admin-border)]">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--admin-border)] overflow-hidden">
              <img src={user?.avatar_url || "https://i.pravatar.cc/150?u=admin"} alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--admin-text-main)] text-sm font-bold truncate max-w-[100px]">{user?.name || 'Administrador'}</span>
              <span className="text-[var(--admin-text-muted)] text-[10px]">{user?.role || 'SYSTEM'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition-colors text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do Painel</span>
        </button>
      </div>
    </div>
  );
}
