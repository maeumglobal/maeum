'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowRight, Check, Copy, ExternalLink, Send } from 'lucide-react';

export default function PaymentLinkGenerator() {
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [packageName, setPackageName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    setLoading(true);
    setTimeout(() => {
      const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10);
      const link = `https://checkout.stripe.com/c/pay/${paymentId}?amount=${encodeURIComponent(amount)}`;
      setGeneratedLink(link);
      setLoading(false);
    }, 600);
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 flex flex-col h-full min-h-[300px]">
      <h3 className="text-[var(--admin-text-main)] text-sm font-medium mb-1">Criar Link de Pagamento</h3>
      <p className="text-[var(--admin-text-muted)] text-[11px] mb-6">Gere um link seguro da Stripe para enviar ao cliente.</p>

      {generatedLink ? (
        <div className="flex-1 flex flex-col justify-center gap-4 bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl p-5 text-center">
          <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--admin-text-main)]">Link Gerado com Sucesso!</h4>
            <p className="text-[10px] text-[var(--admin-text-muted)] mt-0.5">R$ {amount} • {description}</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg p-2 text-left">
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="bg-transparent text-[10px] text-[var(--admin-text-main)] flex-1 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-[var(--admin-border)] rounded text-[var(--admin-primary)] transition-colors shrink-0"
              title="Copiar link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-[#1A0F14] font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Olá! Segue seu link de pagamento seguro Maeum Global no valor de R$ ${amount}: ${generatedLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center"
              title="Enviar no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={() => { setGeneratedLink(''); setDescription(''); setAmount(''); }}
            className="text-[10px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition-colors mt-1"
          >
            Gerar outro link
          </button>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[var(--admin-text-muted)]">Cliente (opcional)</label>
            <div className="relative">
              <select
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="appearance-none w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[var(--admin-primary)]"
              >
                <option value="">Selecione um cliente</option>
                <option value="Bruno Almeida">Bruno Almeida</option>
                <option value="Juliana Martins">Juliana Martins</option>
                <option value="Carolina Souza">Carolina Souza</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[var(--admin-text-muted)]">Descrição *</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Entrada Horizon of Seven"
              className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--admin-primary)] placeholder:text-[var(--admin-text-muted)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[var(--admin-text-muted)]">Valor (R$) *</label>
              <input 
                type="text" 
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="2.500,00"
                className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--admin-primary)] placeholder:text-[var(--admin-text-muted)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[var(--admin-text-muted)]">Pacote / Roteiro</label>
              <div className="relative">
                <select
                  value={packageName}
                  onChange={e => setPackageName(e.target.value)}
                  className="appearance-none w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[var(--admin-primary)]"
                >
                  <option value="">Selecione o pacote</option>
                  <option value="always">Always Destination</option>
                  <option value="horizon">The Horizon of Seven</option>
                  <option value="army">Founding ARMY Edition</option>
                  <option value="bom-sarang">Bom Sarang</option>
                  <option value="caravana">Caravana de Verão</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-[#1A0F14] font-bold text-xs py-3 rounded-lg transition-colors mt-auto"
          >
            {loading ? 'Gerando link...' : 'Gerar Link de Pagamento'}
          </button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 opacity-70">
          <span className="text-[10px] text-[var(--admin-text-muted)] font-medium">Powered by</span>
          <span className="text-[var(--admin-text-main)] text-sm font-bold tracking-tighter">stripe</span>
        </div>
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] text-[10px] flex items-center gap-1 transition-colors"
        >
          Saiba mais <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
