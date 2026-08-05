'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, createUser, toggleUserActive } from '@/actions/usersActions';
import { Search, UserPlus, CheckCircle, XCircle, Shield, Briefcase, Mail, Phone } from 'lucide-react';
import Image from 'next/image';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

export default function EquipeClient() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'consultora', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getUsers({ pageSize: 50 });
    if (res.success && res.data) {
      setUsers(res.data as UserData[]);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createUser(formData);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'consultora', phone: '' });
      loadUsers();
    } else {
      alert(res.error || 'Erro ao criar usuário');
    }
    setIsSubmitting(false);
  };

  const handleToggleActive = async (id: string) => {
    const res = await toggleUserActive(id);
    if (res.success) {
      loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading text-white">Gerenciar Equipe</h1>
          <p className="text-[11px] text-gray-400 font-light mt-1">Gerencie os acessos das consultoras e administradores.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-3 px-6 rounded-sm transition-all uppercase tracking-widest flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Adicionar Membro
        </button>
      </div>

      <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 sm:p-6 mb-6">
        <div className="relative max-w-md mb-6">
           <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
           <input 
             type="text" 
             placeholder="Buscar por nome ou e-mail..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-[#1A1110] border border-[#3D2620] rounded-full py-2.5 pl-9 pr-4 text-[11px] text-white focus:outline-none focus:border-[#C8A27C]" 
           />
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Carregando equipe...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest border-b border-[#3D2620]">Usuário</th>
                  <th className="py-3 px-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest border-b border-[#3D2620]">Cargo</th>
                  <th className="py-3 px-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest border-b border-[#3D2620]">Contato</th>
                  <th className="py-3 px-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest border-b border-[#3D2620]">Status</th>
                  <th className="py-3 px-4 text-[9px] font-medium text-gray-500 uppercase tracking-widest border-b border-[#3D2620]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D2620]/50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[#2A1112] transition-colors group">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-[#3D2620] bg-[#2A1112] flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatarUrl ? (
                          <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-[10px] text-[#C8A27C] font-bold">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-white">{user.name}</p>
                        <p className="text-[9px] text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#3A141A] text-[#C8A27C] text-[9px] font-bold uppercase tracking-wider">
                        {user.role === 'super_admin' ? <Shield className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-[9px] text-gray-300 flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-500" /> {user.email}</p>
                      <p className="text-[9px] text-gray-300 flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3 text-gray-500" /> {user.phone || 'Não informado'}</p>
                    </td>
                    <td className="py-4 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400"><CheckCircle className="w-3 h-3" /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400"><XCircle className="w-3 h-3" /> Inativo</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                       <button 
                         onClick={() => handleToggleActive(user.id)}
                         className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-colors ${
                           user.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                         }`}
                       >
                         {user.isActive ? 'Bloquear' : 'Ativar'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adicionar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#120B0A] border border-[#3D2620] rounded-md w-full max-w-md p-6 relative">
             <button 
               onClick={() => setIsModalOpen(false)}
               className="absolute top-4 right-4 text-gray-400 hover:text-white"
             >
               <XCircle className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-heading text-white mb-6">Novo Membro</h2>
             
             <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
               <div>
                 <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                 <input 
                   required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-[#1A1110] border border-[#3D2620] rounded-sm p-3 text-[12px] text-white focus:border-[#C8A27C] outline-none"
                 />
               </div>
               <div>
                 <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">E-mail</label>
                 <input 
                   required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                   className="w-full bg-[#1A1110] border border-[#3D2620] rounded-sm p-3 text-[12px] text-white focus:border-[#C8A27C] outline-none"
                 />
               </div>
               <div>
                 <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Telefone</label>
                 <input 
                   type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                   className="w-full bg-[#1A1110] border border-[#3D2620] rounded-sm p-3 text-[12px] text-white focus:border-[#C8A27C] outline-none"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Cargo</label>
                   <select 
                     value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                     className="w-full bg-[#1A1110] border border-[#3D2620] rounded-sm p-3 text-[12px] text-white focus:border-[#C8A27C] outline-none"
                   >
                     <option value="consultora">Consultora</option>
                     <option value="admin">Admin</option>
                     <option value="super_admin">Super Admin</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Senha Inicial</label>
                   <input 
                     required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                     placeholder="Ex: maeum2026"
                     className="w-full bg-[#1A1110] border border-[#3D2620] rounded-sm p-3 text-[12px] text-white focus:border-[#C8A27C] outline-none"
                   />
                 </div>
               </div>
               
               <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-50 text-[#0F0A08] font-bold text-[11px] py-4 rounded-sm transition-all uppercase tracking-widest mt-4"
               >
                 {isSubmitting ? 'Salvando...' : 'Criar Conta'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
