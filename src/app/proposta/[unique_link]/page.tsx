'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, DollarSign, Check, X, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProposalStatusAction, getProposalByLinkAction } from '@/actions/crmActions';
import { db } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicProposalPage() {
  const { unique_link } = useParams();
  const { t } = useLanguage();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadProposal = async () => {
    if (!unique_link) return;
    try {
      const res = await getProposalByLinkAction(unique_link as string);
      if (res.success && res.proposal) {
        const p = res.proposal;
        setProposal({
          id: p.id,
          title: p.title,
          total_amount: p.totalValue,
          status: p.status,
          version: p.version,
          updated_at: p.updatedAt,
          items: p.items || [],
          consultant: p.consultant,
        });
        return;
      }
    } catch (err) {
      console.error('Error fetching proposal from DB:', err);
    }

    const proposals = db.get('proposals') || [];
    const found = proposals.find((p: any) => p.unique_link === unique_link || p.id === unique_link);
    setProposal(found || null);
  };

  useEffect(() => {
    loadProposal();
  }, [unique_link]);

  const handleUpdateStatus = async (status: 'approved' | 'changes_requested') => {
    if (!proposal) return;
    setLoading(true);
    const res = await updateProposalStatusAction(
      proposal.id,
      status,
      status === 'approved' ? t('Aprovado pelo link compartilhado') : changeNotes
    );
    setLoading(false);
    if (res.success) {
      loadProposal();
      setShowChangeForm(false);
      setChangeNotes('');
      setStatusMessage(status === 'approved' ? t('¡Proposta Aprovada com sucesso!') : t('Solicitação de alteração enviada.'));
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  if (!proposal) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-3xl font-light text-secondary">{t('Proposta não encontrada')}</h2>
          <p className="text-xs text-muted-foreground mt-2">{t('O link pode ter expirado ou está incorreto.')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full py-16 px-4 md:px-8">
        {/* Banner styled card */}
        <div className="relative bg-card border border-border/80 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col gap-8 mb-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest">{t('Orçamento Exclusivo')}</span>
              <h1 className="font-heading text-3xl font-light text-secondary uppercase mt-1 leading-tight">
                {proposal.title}
              </h1>
              <span className="text-[10px] text-muted-foreground block mt-1">{t('Versão')} {proposal.version} • {t('Atualizado em')} {new Date(proposal.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                proposal.status === 'approved'
                  ? 'bg-green-500/10 text-green-700 border-green-200'
                  : proposal.status === 'changes_requested'
                  ? 'bg-red-500/10 text-red-600 border-red-200'
                  : 'bg-amber-500/10 text-amber-600 border-amber-200'
              }`}>
                {proposal.status === 'approved' ? t('Aprovada') : proposal.status === 'changes_requested' ? t('Revisão Solicitada') : t('Aguardando Aprovação')}
              </span>
            </div>
          </div>

          {/* Status Updates Notification */}
          {statusMessage && (
            <div className="bg-primary/10 border border-primary/20 text-secondary text-xs rounded-xl p-4 text-center font-bold">
              {statusMessage}
            </div>
          )}

          {/* Items breakdown list */}
          <div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">{t('Itens Selecionados no Itinerário')}</h3>
            <div className="flex flex-col gap-4">
              {proposal.items.map((item: any, idx: number) => (
                <div key={idx} className="border border-border/60 rounded-2xl p-5 bg-muted/10 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">{item.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-light mt-1">{item.details || t('Serviço personalizado de turismo de luxo.')}</p>
                  </div>
                  <span className="font-heading text-sm font-bold text-primary shrink-0">{t('US$')} {item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">{t('Total do Orçamento')}</span>
              <span className="font-heading text-3xl font-bold text-primary">{t('US$')} {proposal.total_amount.toLocaleString()}</span>
            </div>

            {/* Accept/Change buttons */}
            {proposal.status !== 'approved' && (
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-primary hover:bg-accent-hover text-white rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {t('Aprovar Proposta')}
                </Button>
                <Button
                  onClick={() => setShowChangeForm(!showChangeForm)}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 sm:flex-none border-border text-secondary hover:bg-muted rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('Ajustes')}
                </Button>
              </div>
            )}
          </div>

          {/* Change Notes Form */}
          {showChangeForm && (
            <div className="border border-dashed border-border rounded-2xl p-5 bg-card/60 flex flex-col gap-4 mt-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">{t('¿Qué cambios o ajustes te gustaría solicitar?')}</h4>
              <Input
                value={changeNotes}
                onChange={e => setChangeNotes(e.target.value)}
                placeholder={t('Ex: Gostaria de alterar a categoria do hotel ou incluir transfer privativo...')}
                className="rounded-xl border-border text-xs"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowChangeForm(false)} className="text-xs font-bold">{t('Cancelar')}</Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus('changes_requested')}
                  disabled={!changeNotes.trim() || loading}
                  className="bg-primary hover:bg-accent-hover text-white font-bold text-xs"
                >
                  {t('Enviar Solicitação')}
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
