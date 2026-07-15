-- Setup initial database schema for Maeum Global
CREATE TYPE user_role_maeum AS ENUM ('super_admin', 'admin', 'manager', 'editor', 'consultora', 'customer');
CREATE TYPE lead_status AS ENUM ('lead', 'contact', 'consultant_assigned', 'proposal', 'negotiation', 'approval', 'payment', 'trip_preparation', 'trip_completed');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'approved', 'changes_requested');

CREATE TABLE maeum_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role_maeum NOT NULL DEFAULT 'customer',
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    description TEXT,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    map_coordinates JSONB,
    video_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT
);

CREATE TABLE maeum_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES maeum_destinations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    start_dates DATE[] DEFAULT '{}',
    end_dates DATE[] DEFAULT '{}',
    description TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    itinerary JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de roteiros diários
    included TEXT[] DEFAULT '{}',
    not_included TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE maeum_crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    interest_destination VARCHAR(255),
    origin VARCHAR(100),
    status lead_status NOT NULL DEFAULT 'lead',
    assigned_consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES maeum_crm_leads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status proposal_status NOT NULL DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de itens (hotéis, KTX, transfers, pacotes)
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unique_link VARCHAR(255) UNIQUE NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_proposal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES maeum_proposals(id) ON DELETE CASCADE,
    version INT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status proposal_status NOT NULL,
    created_by UUID REFERENCES maeum_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES maeum_packages(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cronograma dia-a-dia
    payments JSONB NOT NULL DEFAULT '[]'::jsonb, -- Status das parcelas e valores
    status VARCHAR(50) DEFAULT 'preparation',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES maeum_users(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'passport', 'visa', 'voucher', 'insurance', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, consultant_id)
);

CREATE TABLE maeum_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES maeum_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES maeum_users(id),
    content TEXT,
    attachment_url TEXT,
    attachment_type VARCHAR(50), -- 'image', 'pdf', etc.
    read_at TIMESTAMPTZ,
    translated_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maeum_cms_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    section_id VARCHAR(100) NOT NULL,
    block_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE maeum_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Data
INSERT INTO maeum_users (id, email, name, role, phone) VALUES
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@maeum.com', 'Super Administrador Maeum', 'super_admin', '+5541999999999'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'consultora1@maeum.com', 'Mariana Santos', 'consultora', '+5541988888888'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cliente@maeum.com', 'Bruno Almeida', 'customer', '+5541977777777');

INSERT INTO maeum_destinations (id, name, slug, country, description, main_image, gallery, is_featured) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coreia do Sul', 'coreia-do-sul', 'Coreia', 'Um país fascinante que mistura tradição milenar com modernidade futurista.', '/destinations/seoul.jpg', '{"/destinations/seoul-1.jpg", "/destinations/seoul-2.jpg"}', true),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Japão', 'japao', 'Japão', 'Templos históricos, montanhas majestosas e metrópoles vibrantes.', '/destinations/tokyo.jpg', '{"/destinations/tokyo-1.jpg", "/destinations/tokyo-2.jpg"}', true),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Vietnã', 'vietna', 'Vietnã', 'Paisagens naturais exuberantes e ricas experiências culinárias.', '/destinations/hanoi.jpg', '{"/destinations/hanoi-1.jpg"}', true);

INSERT INTO maeum_packages (id, destination_id, title, slug, price, description, status, itinerary, included, not_included) VALUES
('c1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Essência da Coreia do Sul', 'essencia-da-coreia-do-sul', 3500.00, 'Pacote de 10 dias explorando Seul, Busan e Gyeongju.', 'active',
'[
  {"day": 1, "title": "Chegada em Seul", "description": "Recepção no aeroporto de Incheon e traslado privativo para o hotel de luxo. Tempo livre para descanso."},
  {"day": 2, "title": "Palácios Tradicionais", "description": "Visita guiada ao Palácio Gyeongbokgung com aluguel de Hanbok. Almoço tradicional em Insadong e passeio por Bukchon Hanok Village."},
  {"day": 3, "title": "Modernidade e Vlogs", "description": "Passeio pelo bairro de Hongdae, visita à N Seoul Tower e compras em Myeongdong."}
]'::jsonb,
'{"Traslado privativo", "Hospedagem 5 estrelas", "Guia em português", "Ingressos de atrações"}',
'{"Passagens aéreas internacionais", "Seguro viagem", "Alimentação não descrita"}');

INSERT INTO maeum_crm_leads (id, name, phone, email, interest_destination, origin, status, assigned_consultant_id, notes) VALUES
('e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bruno Almeida', '+5541977777777', 'cliente@maeum.com', 'Coreia do Sul', 'Site / Formulário Destinos', 'proposal', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lead muito interessado em fazer intercâmbio e viagem de férias em Seul. Proposta em elaboração.');

INSERT INTO maeum_proposals (id, client_id, consultant_id, lead_id, title, status, total_amount, unique_link, items) VALUES
('f1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', 'Viagem de Luxo - Coreia de Bruno', 'sent', 4200.00, 'viagem-bruno-seul-2026',
'[
  {"type": "package", "name": "Essência da Coreia do Sul", "price": 3500.00, "details": "10 Dias de roteiro completo com guias exclusivos"},
  {"type": "insurance", "name": "Seguro Viagem Global Premium", "price": 150.00, "details": "Cobertura médica internacional ampliada"},
  {"type": "ktx_pass", "name": "KTX Rail Pass Coreia - 5 dias", "price": 200.00, "details": "Passagens ilimitadas de trem-bala"},
  {"type": "wifi_chip", "name": "Chip eSIM de Dados Ilimitados", "price": 50.00, "details": "Conexão 4G/5G ilimitada por toda a viagem"},
  {"type": "extra_tour", "name": "Sessão de Fotos com Fotógrafo em Bukchon", "price": 300.00, "details": "Ensaio fotográfico privativo de 2 horas"}
]'::jsonb);

INSERT INTO maeum_system_settings (key, value) VALUES
('visual_theme', '{
    "colors": {
        "primary": "#c8a27c",
        "secondary": "#1c1c1c",
        "accent": "#b8860b",
        "accentHover": "#8b6508",
        "text": "#1c1c1c",
        "background": "#faf9f6",
        "card": "#ffffff"
    },
    "typography": {
        "titleFont": "Cormorant Garamond",
        "bodyFont": "Plus Jakarta Sans",
        "baseSize": "16px"
    },
    "logo_url": "/logo-maeum.png",
    "favicon_url": "/favicon-maeum.ico"
}'::jsonb),
('company_details', '{
    "name": "Maeum Global Travel S.L.",
    "phone": "+55 (41) 98709-4799",
    "whatsapp": "+5541987094799",
    "email": "contato@maeumglobal.com",
    "address": "Av. Batel 1230, Curitiba, PR, Brasil",
    "social": {
        "instagram": "https://instagram.com/maeumglobal",
        "youtube": "https://youtube.com/maeumglobal"
    }
}'::jsonb);

-- =========================================================================
-- MAEUM INDEXES FOR QUERY OPTIMIZATION (NEW)
-- =========================================================================
CREATE INDEX idx_maeum_packages_destination ON maeum_packages(destination_id);
CREATE INDEX idx_maeum_packages_slug ON maeum_packages(slug);
CREATE INDEX idx_maeum_crm_leads_assigned ON maeum_crm_leads(assigned_consultant_id);
CREATE INDEX idx_maeum_proposals_client ON maeum_proposals(client_id);
CREATE INDEX idx_maeum_proposals_unique_link ON maeum_proposals(unique_link);
CREATE INDEX idx_maeum_chat_messages_chat ON maeum_chat_messages(chat_id);
CREATE INDEX idx_maeum_trips_client ON maeum_trips(client_id);
CREATE INDEX idx_maeum_documents_client ON maeum_documents(client_id);
