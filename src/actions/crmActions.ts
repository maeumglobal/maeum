'use server';

import { db } from '@/lib/db';

export async function submitLeadAction(data: { name: string; phone: string; email: string; interest: string; origin: string }) {
  try {
    const leads = db.get('crm_leads');
    const newLead = {
      id: crypto.randomUUID(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      interest_destination: data.interest,
      origin: data.origin,
      status: 'lead',
      assigned_consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Auto-assign to Mariana Santos for demo
      notes: 'Lead captado dinamicamente via formulário da landing page.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    leads.push(newLead);
    db.save('crm_leads', leads);
    return { success: true, lead: newLead };
  } catch (error: any) {
    console.error('Error submitting lead:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProposalStatusAction(proposalId: string, status: 'approved' | 'changes_requested', notes?: string) {
  try {
    const proposals = db.get('proposals');
    const idx = proposals.findIndex((p: any) => p.id === proposalId || p.unique_link === proposalId);
    
    if (idx === -1) {
      return { success: false, error: 'Proposta não encontrada.' };
    }

    const proposal = proposals[idx];
    
    // Save version history before updating
    const versions = db.get('proposal_versions');
    versions.push({
      id: crypto.randomUUID(),
      proposal_id: proposal.id,
      version: proposal.version,
      items: proposal.items,
      total_amount: proposal.total_amount,
      status: proposal.status,
      created_by: proposal.client_id,
      created_at: new Date().toISOString()
    });
    db.save('proposal_versions', versions);

    // Update status
    proposal.status = status;
    proposal.version = proposal.version + 1;
    proposal.updated_at = new Date().toISOString();
    proposals[idx] = proposal;
    db.save('proposals', proposals);

    // If approved, create/update client's trip timeline automatically!
    if (status === 'approved') {
      const trips = db.get('trips');
      const tripId = crypto.randomUUID();
      trips.push({
        id: tripId,
        client_id: proposal.client_id,
        title: `Viagem: ${proposal.title}`,
        start_date: '2026-10-15',
        end_date: '2026-10-25',
        status: 'preparation',
        timeline: [
          { date: '2026-10-15', time: '14:00', title: 'Check-in Hospedagem de Luxo', description: 'Traslado privativo e recepção VIP.' },
          { date: '2026-10-16', time: '09:00', title: 'Experiência Cultural Exclusiva', description: 'Visita guiada privativa com fotógrafo.' }
        ],
        payments: [
          { due_date: '2026-08-15', amount: proposal.total_amount / 2, status: 'pending' },
          { due_date: '2026-09-15', amount: proposal.total_amount / 2, status: 'pending' }
        ],
        created_at: new Date().toISOString()
      });
      db.save('trips', trips);
    }

    // Add note to CRM Lead if associated
    if (proposal.lead_id) {
      const leads = db.get('crm_leads');
      const leadIdx = leads.findIndex((l: any) => l.id === proposal.lead_id);
      if (leadIdx !== -1) {
        leads[leadIdx].status = status === 'approved' ? 'approval' : 'negotiation';
        leads[leadIdx].notes = `${leads[leadIdx].notes}\n[${new Date().toLocaleDateString()}] Proposta atualizada para status: ${status}. Comentários: ${notes || 'Sem observações'}`;
        leads[leadIdx].updated_at = new Date().toISOString();
        db.save('crm_leads', leads);
      }
    }

    return { success: true, proposal };
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return { success: false, error: error.message };
  }
}

export async function submitChatMessageAction(chatId: string, senderId: string, content: string) {
  try {
    const messages = db.get('chat_messages');
    const newMsg = {
      id: crypto.randomUUID(),
      chat_id: chatId,
      sender_id: senderId,
      content,
      attachment_url: null,
      attachment_type: null,
      read_at: null,
      created_at: new Date().toISOString()
    };
    messages.push(newMsg);
    db.save('chat_messages', messages);
    return { success: true, message: newMsg };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadDocumentAction(clientId: string, data: { file_name: string; file_url: string; file_size: number; category: string }) {
  try {
    const documents = db.get('documents');
    const newDoc = {
      id: crypto.randomUUID(),
      client_id: clientId,
      uploaded_by: clientId,
      file_name: data.file_name,
      file_url: data.file_url,
      file_size: data.file_size,
      category: data.category,
      created_at: new Date().toISOString()
    };
    documents.push(newDoc);
    db.save('documents', documents);
    return { success: true, document: newDoc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProposalAction(clientId: string, consultantId: string, title: string, items: any[], totalAmount: number) {
  try {
    const proposals = db.get('proposals');
    const newProp = {
      id: crypto.randomUUID(),
      client_id: clientId,
      consultant_id: consultantId,
      lead_id: null,
      title,
      status: 'draft',
      items,
      total_amount: totalAmount,
      unique_link: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000),
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    proposals.push(newProp);
    db.save('proposals', proposals);
    return { success: true, proposal: newProp };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
