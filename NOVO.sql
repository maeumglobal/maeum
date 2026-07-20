-- NOVO.sql: Estrutura Completa de Tabelas para a Plataforma CRM Maeum Global no Supabase (PostgreSQL)

-- 1. TABELA DE USUÁRIOS E EQUIPE (ADMINS, CONSULTORAS, CLIENTES)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Opcional, para linkar com auth.users do Supabase Auth
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'customer', -- 'super_admin', 'admin', 'consultora', 'customer'
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE NOTIFICAÇÕES (PARA O ADMIN HEADER)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE LEADS & CONSULTAS (CRM)
CREATE TABLE public.crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    interest_destination VARCHAR(255),
    budget DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'lead', -- 'lead', 'contact', 'proposal', 'negotiation', 'approval', 'payment', 'trip_preparation', 'trip_completed'
    notes TEXT,
    assigned_consultant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE PACOTES & PRODUTOS
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    destination VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'draft', 'archived'
    gallery TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE ORÇAMENTOS (PROPOSALS DIGITAIS)
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    unique_link VARCHAR(255) UNIQUE,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA DE ITENS DO ORÇAMENTO
CREATE TABLE public.proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'package', 'flight', 'insurance', 'extra'
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    details TEXT
);

-- 7. TABELA DE RESERVAS (BOOKINGS)
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled', 'completed'
    start_date DATE,
    end_date DATE,
    total_price DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABELA FINANCEIRA (PAGAMENTOS / STRIPE LINKS)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255) UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'credit_card', 'pix', 'boleto'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 9. TABELA DE EXPERIÊNCIAS E PARCEIROS
CREATE TABLE public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    price_per_person DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'active'
);

-- HABILITAR REALTIME (Para o Chat e Notificações no Supabase)
-- (No painel do Supabase, você precisará habilitar isso manualmente nas tabelas de 'notifications' e 'chat_messages' se houver)

-- TRIGGERS PARA ATUALIZAR 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_proposals_modtime BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
