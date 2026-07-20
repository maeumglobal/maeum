-- ============================================================================
-- MAEUM GLOBAL — COMPLETE ENTERPRISE DATABASE SCHEMA
-- ============================================================================
-- This migration contains the entire database schema for Maeum Global,
-- a premium travel & exchange platform. It includes all tables, enums,
-- RLS policies, functions, triggers, seed data, and indexes.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
CREATE TYPE user_role_maeum AS ENUM ('super_admin', 'admin', 'manager', 'editor', 'consultora', 'customer');
CREATE TYPE lead_status AS ENUM ('lead', 'contact', 'consultant_assigned', 'proposal', 'negotiation', 'approval', 'payment', 'trip_preparation', 'trip_completed');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'approved', 'changes_requested');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE booking_type AS ENUM ('direct', 'request');
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'sold_out', 'cancelled');
CREATE TYPE payment_method AS ENUM ('pix', 'boleto', 'credit_card', 'transfer', 'paypal');
CREATE TYPE navigation_type AS ENUM ('main', 'footer', 'mobile');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document', 'audio');
CREATE TYPE journey_category AS ENUM ('premium', 'army', 'standard');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2.1 Users
CREATE TABLE maeum_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role_maeum NOT NULL DEFAULT 'customer',
    phone VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    whatsapp VARCHAR(50),
    languages TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Destinations
CREATE TABLE maeum_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    description TEXT,
    short_description TEXT,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    map_coordinates JSONB,
    video_url TEXT,
    video_embed TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    status content_status DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Packages
CREATE TABLE maeum_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES maeum_destinations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'USD',
    duration_days INT,
    start_dates DATE[] DEFAULT '{}',
    end_dates DATE[] DEFAULT '{}',
    description TEXT,
    short_description TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    itinerary JSONB DEFAULT '[]'::jsonb,
    included TEXT[] DEFAULT '{}',
    not_included TEXT[] DEFAULT '{}',
    highlights JSONB DEFAULT '[]'::jsonb,
    faq JSONB DEFAULT '[]'::jsonb,
    payment_options JSONB DEFAULT '{}'::jsonb,
    status content_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 CRM Leads
CREATE TABLE maeum_crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    interest_destination VARCHAR(255),
    interest_product_id UUID,
    interest_product_type VARCHAR(50),
    origin VARCHAR(100),
    status lead_status NOT NULL DEFAULT 'lead',
    assigned_consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    source_url TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Proposals
CREATE TABLE maeum_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES maeum_crm_leads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status proposal_status NOT NULL DEFAULT 'draft',
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_conditions TEXT,
    validity_days INT DEFAULT 15,
    unique_link VARCHAR(255) UNIQUE NOT NULL,
    version INT NOT NULL DEFAULT 1,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Proposal Versions
CREATE TABLE maeum_proposal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES maeum_proposals(id) ON DELETE CASCADE,
    version INT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status proposal_status NOT NULL,
    change_notes TEXT,
    created_by UUID REFERENCES maeum_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Trips
CREATE TABLE maeum_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES maeum_packages(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES maeum_proposals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timeline JSONB DEFAULT '[]'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'preparation',
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Documents
CREATE TABLE maeum_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES maeum_trips(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES maeum_users(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Chats
CREATE TABLE maeum_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, consultant_id)
);

-- 2.10 Chat Messages
CREATE TABLE maeum_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES maeum_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES maeum_users(id),
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'text',
    attachment_url TEXT,
    attachment_type VARCHAR(50),
    translated_content JSONB,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CMS & CONTENT MANAGEMENT
-- ============================================================================

-- 3.1 Site Settings (global configuration)
CREATE TABLE maeum_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Navigation Items
CREATE TABLE maeum_navigation_items (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES maeum_navigation_items(id) ON DELETE CASCADE,
    navigation_type navigation_type NOT NULL DEFAULT 'main',
    label VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    icon VARCHAR(100),
    target VARCHAR(20) DEFAULT '_self',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    allowed_roles user_role_maeum[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 CMS Pages (static pages like privacy, terms, about, etc.)
CREATE TABLE maeum_cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    main_image TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    template VARCHAR(100) DEFAULT 'default',
    status content_status DEFAULT 'draft',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 CMS Blocks (reusable content blocks for page builder)
CREATE TABLE maeum_cms_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug VARCHAR(255) NOT NULL,
    section_id VARCHAR(100) NOT NULL,
    block_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Media Library
CREATE TABLE maeum_media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    alt_text TEXT,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    media_type media_type NOT NULL DEFAULT 'image',
    mime_type VARCHAR(100),
    file_size INT,
    width INT,
    height INT,
    folder VARCHAR(255) DEFAULT '/',
    tags TEXT[] DEFAULT '{}',
    uploaded_by UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Blog Categories
CREATE TABLE maeum_blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Blog Posts
CREATE TABLE maeum_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content JSONB,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    category_id UUID REFERENCES maeum_blog_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Testimonials
CREATE TABLE maeum_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    author_avatar TEXT,
    content TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    destination_id UUID REFERENCES maeum_destinations(id) ON DELETE SET NULL,
    product_type VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'published',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 FAQ Items
CREATE TABLE maeum_faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    destination_id UUID REFERENCES maeum_destinations(id) ON DELETE SET NULL,
    product_type VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. EXPERIENCES
-- ============================================================================

-- 4.1 Categories (for experiences)
CREATE TABLE maeum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    destination VARCHAR(100) DEFAULT 'Coreia do Sul',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Experiences
CREATE TABLE maeum_experiences (
    id TEXT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    location VARCHAR(255),
    region VARCHAR(100),
    city VARCHAR(100),
    category_slugs TEXT[] DEFAULT '{}',
    description TEXT,
    highlights TEXT[] DEFAULT '{}',
    included TEXT[] DEFAULT '{}',
    not_included TEXT[] DEFAULT '{}',
    duration_hours NUMERIC(5,1),
    price_per_person NUMERIC(10,2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'BRL',
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    faq JSONB DEFAULT '[]'::jsonb,
    booking_type booking_type DEFAULT 'direct',
    available_from DATE,
    min_participants INT DEFAULT 1,
    max_participants INT DEFAULT 20,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Experience Availability (calendar)
CREATE TABLE maeum_experience_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id TEXT REFERENCES maeum_experiences(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    max_participants INT DEFAULT 10,
    available_spots INT DEFAULT 10,
    status availability_status DEFAULT 'available',
    price_adjustment NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 K-Beauty Partners
CREATE TABLE maeum_kbeauty_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 K-Beauty Experiences
CREATE TABLE maeum_kbeauty_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    location VARCHAR(255),
    region VARCHAR(100),
    city VARCHAR(100),
    partner_id UUID REFERENCES maeum_kbeauty_partners(id) ON DELETE SET NULL,
    description TEXT,
    highlights TEXT[] DEFAULT '{}',
    included TEXT[] DEFAULT '{}',
    not_included TEXT[] DEFAULT '{}',
    duration_hours NUMERIC(5,1),
    price_per_person NUMERIC(10,2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'BRL',
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    faq JSONB DEFAULT '[]'::jsonb,
    booking_type booking_type DEFAULT 'request',
    available_from DATE,
    min_participants INT DEFAULT 1,
    max_participants INT DEFAULT 10,
    requires_confirmation BOOLEAN DEFAULT TRUE,
    is_partner_experience BOOLEAN DEFAULT FALSE,
    is_included_in_journey BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 K-Beauty Availability
CREATE TABLE maeum_kbeauty_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kbeauty_experience_id UUID REFERENCES maeum_kbeauty_experiences(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    max_participants INT DEFAULT 5,
    available_spots INT DEFAULT 5,
    status availability_status DEFAULT 'available',
    price_adjustment NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. EXCHANGE PROGRAMS
-- ============================================================================

-- 5.1 Exchange Institutions
CREATE TABLE maeum_exchange_institutions (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    country VARCHAR(100) DEFAULT 'Coreia do Sul',
    website TEXT,
    logo_url TEXT,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Exchange Campuses
CREATE TABLE maeum_exchange_campuses (
    id TEXT PRIMARY KEY,
    institution_id TEXT REFERENCES maeum_exchange_institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    location TEXT,
    description TEXT,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    address TEXT,
    map_coordinates JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 Exchange Programs
CREATE TABLE maeum_exchange_programs (
    id TEXT PRIMARY KEY,
    institution_id TEXT REFERENCES maeum_exchange_institutions(id) ON DELETE CASCADE,
    campus_id TEXT REFERENCES maeum_exchange_campuses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_weeks_min INT DEFAULT 1,
    duration_weeks_max INT DEFAULT 52,
    classes_per_week INT DEFAULT 15,
    class_hours_per_week NUMERIC(5,1),
    level_required VARCHAR(100) DEFAULT 'Todos os níveis',
    pricing_tiers JSONB DEFAULT '[]'::jsonb,
    includes_enrollment_fee BOOLEAN DEFAULT FALSE,
    enrollment_fee NUMERIC(10,2) DEFAULT 0,
    enrollment_fee_currency VARCHAR(10) DEFAULT 'KRW',
    includes_material BOOLEAN DEFAULT FALSE,
    material_fee NUMERIC(10,2) DEFAULT 0,
    material_fee_currency VARCHAR(10) DEFAULT 'KRW',
    includes_accommodation BOOLEAN DEFAULT FALSE,
    cultural_activities BOOLEAN DEFAULT FALSE,
    cultural_activities_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.4 Exchange Inquiries (form submissions)
CREATE TABLE maeum_exchange_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    country_of_residence VARCHAR(100),
    preferred_language VARCHAR(50),
    age INT,
    campus_id TEXT REFERENCES maeum_exchange_campuses(id) ON DELETE SET NULL,
    program_id TEXT REFERENCES maeum_exchange_programs(id) ON DELETE SET NULL,
    korean_level VARCHAR(50),
    weeks INT,
    preferred_period VARCHAR(255),
    interested_in_accommodation BOOLEAN DEFAULT FALSE,
    interested_in_insurance BOOLEAN DEFAULT FALSE,
    interested_in_transfer BOOLEAN DEFAULT FALSE,
    notes TEXT,
    status lead_status DEFAULT 'lead',
    assigned_consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. GROUP JOURNEYS
-- ============================================================================

-- 6.1 Journeys
CREATE TABLE maeum_journeys (
    id TEXT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    concept TEXT,
    destinations TEXT[] DEFAULT '{}',
    duration_days INT NOT NULL,
    total_spots INT DEFAULT 15,
    accommodation VARCHAR(255),
    accommodation_details TEXT,
    price_per_person NUMERIC(10,2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'BRL',
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    video_url TEXT,
    video_embed TEXT,
    included TEXT[] DEFAULT '{}',
    not_included TEXT[] DEFAULT '{}',
    itinerary JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    categories JSONB DEFAULT '[]'::jsonb,
    faq JSONB DEFAULT '[]'::jsonb,
    payment_options JSONB DEFAULT '{}'::jsonb,
    status content_status DEFAULT 'draft',
    category journey_category DEFAULT 'premium',
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Journey Departures
CREATE TABLE maeum_journey_departures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id TEXT REFERENCES maeum_journeys(id) ON DELETE CASCADE,
    title VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_spots INT NOT NULL,
    available_spots INT NOT NULL,
    status availability_status DEFAULT 'available',
    notes TEXT,
    price_adjustment NUMERIC(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 Journey Inquiries
CREATE TABLE maeum_journey_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id TEXT REFERENCES maeum_journeys(id) ON DELETE SET NULL,
    departure_id UUID REFERENCES maeum_journey_departures(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    participants INT DEFAULT 1,
    preferred_category VARCHAR(100),
    message TEXT,
    status lead_status DEFAULT 'lead',
    assigned_consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. E-COMMERCE & PAYMENTS
-- ============================================================================

-- 7.1 Payment Methods Configuration
CREATE TABLE maeum_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method payment_method NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 Coupons / Discount Codes
CREATE TABLE maeum_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    min_purchase_amount NUMERIC(10,2),
    max_uses INT,
    current_uses INT DEFAULT 0,
    max_uses_per_user INT DEFAULT 1,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    applicable_products TEXT[] DEFAULT '{}',
    applicable_categories TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.3 Orders (for future checkout)
CREATE TABLE maeum_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES maeum_proposals(id) ON DELETE SET NULL,
    product_type VARCHAR(50) NOT NULL,
    product_id UUID,
    product_name VARCHAR(255),
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    coupon_id UUID REFERENCES maeum_coupons(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method payment_method,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_details JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. NOTIFICATIONS & COMMUNICATION
-- ============================================================================

-- 8.1 Notification Templates
CREATE TABLE maeum_notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    channels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 Notifications
CREATE TABLE maeum_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES maeum_users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    channel VARCHAR(50) DEFAULT 'in_app',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. AUDIT & ANALYTICS
-- ============================================================================

-- 9.1 Activity Log
CREATE TABLE maeum_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.2 Page Views
CREATE TABLE maeum_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_url TEXT NOT NULL,
    page_title VARCHAR(255),
    user_id UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    referrer TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    device_type VARCHAR(50),
    country VARCHAR(100),
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.3 Newsletter Subscribers
CREATE TABLE maeum_newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    interests TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 10. NEWSLETTER / EMAIL MARKETING
-- ============================================================================

CREATE TABLE maeum_newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    segment JSONB DEFAULT '{}'::jsonb,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_recipients INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES maeum_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. INDEXES
-- ============================================================================

-- Core indexes
CREATE INDEX idx_maeum_users_email ON maeum_users(email);
CREATE INDEX idx_maeum_users_role ON maeum_users(role);
CREATE INDEX idx_maeum_destinations_slug ON maeum_destinations(slug);
CREATE INDEX idx_maeum_destinations_featured ON maeum_destinations(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_maeum_packages_slug ON maeum_packages(slug);
CREATE INDEX idx_maeum_packages_destination ON maeum_packages(destination_id);
CREATE INDEX idx_maeum_packages_status ON maeum_packages(status);
CREATE INDEX idx_maeum_crm_leads_status ON maeum_crm_leads(status);
CREATE INDEX idx_maeum_crm_leads_assigned ON maeum_crm_leads(assigned_consultant_id);
CREATE INDEX idx_maeum_proposals_client ON maeum_proposals(client_id);
CREATE INDEX idx_maeum_proposals_unique_link ON maeum_proposals(unique_link);
CREATE INDEX idx_maeum_proposals_status ON maeum_proposals(status);
CREATE INDEX idx_maeum_trips_client ON maeum_trips(client_id);
CREATE INDEX idx_maeum_documents_client ON maeum_documents(client_id);
CREATE INDEX idx_maeum_chat_messages_chat ON maeum_chat_messages(chat_id);
CREATE INDEX idx_maeum_chat_messages_created ON maeum_chat_messages(created_at);

-- CMS indexes
CREATE INDEX idx_maeum_navigation_type ON maeum_navigation_items(navigation_type);
CREATE INDEX idx_maeum_navigation_active ON maeum_navigation_items(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_maeum_cms_pages_slug ON maeum_cms_pages(slug);
CREATE INDEX idx_maeum_cms_blocks_page ON maeum_cms_blocks(page_slug);
CREATE INDEX idx_maeum_blog_posts_slug ON maeum_blog_posts(slug);
CREATE INDEX idx_maeum_blog_posts_status ON maeum_blog_posts(status);
CREATE INDEX idx_maeum_blog_posts_published ON maeum_blog_posts(published_at) WHERE status = 'published';
CREATE INDEX idx_maeum_blog_posts_category ON maeum_blog_posts(category_id);
CREATE INDEX idx_maeum_media_uploaded_by ON maeum_media_library(uploaded_by);
CREATE INDEX idx_maeum_media_type ON maeum_media_library(media_type);

-- Experiences indexes
CREATE INDEX idx_maeum_experiences_slug ON maeum_experiences(slug);
CREATE INDEX idx_maeum_experiences_status ON maeum_experiences(status);
CREATE INDEX idx_maeum_experiences_category ON maeum_experiences USING GIN(category_slugs);
CREATE INDEX idx_maeum_experience_availability_date ON maeum_experience_availability(date);
CREATE INDEX idx_maeum_experience_availability_experience ON maeum_experience_availability(experience_id);
CREATE INDEX idx_maeum_experience_availability_status ON maeum_experience_availability(status);
CREATE INDEX idx_maeum_kbeauty_experiences_slug ON maeum_kbeauty_experiences(slug);
CREATE INDEX idx_maeum_kbeauty_experiences_partner ON maeum_kbeauty_experiences(partner_id);

-- Exchange indexes
CREATE INDEX idx_maeum_exchange_campuses_institution ON maeum_exchange_campuses(institution_id);
CREATE INDEX idx_maeum_exchange_programs_institution ON maeum_exchange_programs(institution_id);
CREATE INDEX idx_maeum_exchange_programs_slug ON maeum_exchange_programs(slug);
CREATE INDEX idx_maeum_exchange_inquiries_status ON maeum_exchange_inquiries(status);

-- Journeys indexes
CREATE INDEX idx_maeum_journeys_slug ON maeum_journeys(slug);
CREATE INDEX idx_maeum_journeys_status ON maeum_journeys(status);
CREATE INDEX idx_maeum_journey_departures_journey ON maeum_journey_departures(journey_id);
CREATE INDEX idx_maeum_journey_departures_dates ON maeum_journey_departures(start_date, end_date);

-- Commerce & analytics indexes
CREATE INDEX idx_maeum_orders_client ON maeum_orders(client_id);
CREATE INDEX idx_maeum_orders_status ON maeum_orders(status);
CREATE INDEX idx_maeum_coupons_code ON maeum_coupons(code);
CREATE INDEX idx_maeum_notifications_user ON maeum_notifications(user_id);
CREATE INDEX idx_maeum_notifications_read ON maeum_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_maeum_activity_log_created ON maeum_activity_log(created_at);
CREATE INDEX idx_maeum_activity_log_user ON maeum_activity_log(user_id);
CREATE INDEX idx_maeum_page_views_created ON maeum_page_views(created_at);
CREATE INDEX idx_maeum_page_views_url ON maeum_page_views(page_url);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE maeum_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_experience_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_kbeauty_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_kbeauty_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_kbeauty_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_exchange_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_exchange_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_exchange_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_exchange_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_journey_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_journey_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maeum_newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
-- Helper function to get user role (defined in public schema, not auth — auth is Supabase-managed)
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS user_role_maeum AS $$
DECLARE
    role_val user_role_maeum;
BEGIN
    SELECT role INTO role_val FROM maeum_users WHERE id = auth.uid();
    RETURN role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user has admin-level access
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('super_admin', 'admin', 'manager', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user is staff (admin or consultora)
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('super_admin', 'admin', 'manager', 'editor', 'consultora');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: Users
CREATE POLICY "Users can read own data" ON maeum_users
    FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own data" ON maeum_users
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can manage all users" ON maeum_users
    FOR ALL USING (public.is_admin());

-- RLS: Public content (readable by everyone)
CREATE POLICY "Public read destinations" ON maeum_destinations
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read packages" ON maeum_packages
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read experiences" ON maeum_experiences
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read kbeauty" ON maeum_kbeauty_experiences
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read institutions" ON maeum_exchange_institutions
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read campuses" ON maeum_exchange_campuses
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read programs" ON maeum_exchange_programs
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read journeys" ON maeum_journeys
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read departures" ON maeum_journey_departures
    FOR SELECT USING (TRUE);
CREATE POLICY "Public read blog" ON maeum_blog_posts
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read categories" ON maeum_categories
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read testimonials" ON maeum_testimonials
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read faq" ON maeum_faq_items
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read navigation" ON maeum_navigation_items
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read cms_pages" ON maeum_cms_pages
    FOR SELECT USING (status = 'published');
CREATE POLICY "Public read cms_blocks" ON maeum_cms_blocks
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read media" ON maeum_media_library
    FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Public read payment_methods" ON maeum_payment_methods
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read site_settings" ON maeum_site_settings
    FOR SELECT USING (TRUE);
CREATE POLICY "Public subscribe newsletter" ON maeum_newsletter_subscribers
    FOR INSERT WITH CHECK (TRUE);

-- RLS: Admin full access to all content tables
CREATE POLICY "Admin full access destinations" ON maeum_destinations FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access packages" ON maeum_packages FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access experiences" ON maeum_experiences FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access kbeauty" ON maeum_kbeauty_experiences FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access institutions" ON maeum_exchange_institutions FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access campuses" ON maeum_exchange_campuses FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access programs" ON maeum_exchange_programs FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access journeys" ON maeum_journeys FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access departures" ON maeum_journey_departures FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access blog" ON maeum_blog_posts FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access categories" ON maeum_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access testimonials" ON maeum_testimonials FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access faq" ON maeum_faq_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access navigation" ON maeum_navigation_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access cms_pages" ON maeum_cms_pages FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access cms_blocks" ON maeum_cms_blocks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access media" ON maeum_media_library FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access site_settings" ON maeum_site_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access leads" ON maeum_crm_leads FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access coupons" ON maeum_coupons FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access payment_methods" ON maeum_payment_methods FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access newsletter_campaigns" ON maeum_newsletter_campaigns FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access notification_templates" ON maeum_notification_templates FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access activity_log" ON maeum_activity_log FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access page_views" ON maeum_page_views FOR ALL USING (public.is_admin());

-- RLS: Consultant access
CREATE POLICY "Consultant read assigned leads" ON maeum_crm_leads
    FOR SELECT USING (public.is_staff() AND (assigned_consultant_id = auth.uid() OR public.is_admin()));
CREATE POLICY "Consultant update assigned leads" ON maeum_crm_leads
    FOR UPDATE USING (public.is_staff() AND (assigned_consultant_id = auth.uid() OR public.is_admin()));
CREATE POLICY "Consultant full proposals" ON maeum_proposals
    FOR ALL USING (public.is_staff() AND (consultant_id = auth.uid() OR public.is_admin()));
CREATE POLICY "Consultant read own chats" ON maeum_chats
    FOR SELECT USING (public.is_staff() AND (consultant_id = auth.uid() OR public.is_admin()));
CREATE POLICY "Consultant send messages" ON maeum_chat_messages
    FOR INSERT WITH CHECK (public.is_staff() AND sender_id = auth.uid());

-- RLS: Customer access
CREATE POLICY "Customer read own proposals" ON maeum_proposals
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Customer read own trips" ON maeum_trips
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Customer read own documents" ON maeum_documents
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Customer read own chats" ON maeum_chats
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Customer send messages" ON maeum_chat_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Customer read own notifications" ON maeum_notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Customer update own notifications" ON maeum_notifications
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Customer read own orders" ON maeum_orders
    FOR SELECT USING (client_id = auth.uid());

-- RLS: Leads can create inquiries
CREATE POLICY "Anyone can create exchange inquiry" ON maeum_exchange_inquiries
    FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can create journey inquiry" ON maeum_journey_inquiries
    FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- 13. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 13.1 Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON maeum_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON maeum_destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON maeum_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON maeum_crm_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON maeum_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON maeum_trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON maeum_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON maeum_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kbeauty_experiences_updated_at BEFORE UPDATE ON maeum_kbeauty_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_institutions_updated_at BEFORE UPDATE ON maeum_exchange_institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_campuses_updated_at BEFORE UPDATE ON maeum_exchange_campuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_programs_updated_at BEFORE UPDATE ON maeum_exchange_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON maeum_journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journey_departures_updated_at BEFORE UPDATE ON maeum_journey_departures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cms_blocks_updated_at BEFORE UPDATE ON maeum_cms_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON maeum_media_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON maeum_blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13.2 Auto-create proposal version on status change
CREATE OR REPLACE FUNCTION save_proposal_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.items IS DISTINCT FROM NEW.items THEN
        INSERT INTO maeum_proposal_versions (proposal_id, version, items, total_amount, status, change_notes, created_by)
        VALUES (NEW.id, NEW.version, NEW.items, NEW.total_amount, NEW.status, 'Auto-saved on update', auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER save_proposal_version_trigger
    BEFORE UPDATE ON maeum_proposals
    FOR EACH ROW
    EXECUTE FUNCTION save_proposal_version();

-- 13.3 Auto-generate unique_link for proposals
CREATE OR REPLACE FUNCTION generate_proposal_unique_link()
RETURNS TRIGGER AS $$
DECLARE
    random_slug TEXT;
BEGIN
    IF NEW.unique_link IS NULL OR NEW.unique_link = '' THEN
        random_slug := 'proposta-' || LOWER(REPLACE(NEW.title, ' ', '-')) || '-' || SUBSTR(MD5(NEW.id::TEXT || NOW()::TEXT)::TEXT, 1, 8);
        NEW.unique_link := random_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_proposal_link_trigger
    BEFORE INSERT ON maeum_proposals
    FOR EACH ROW
    EXECUTE FUNCTION generate_proposal_unique_link();

-- 13.4 Auto-create chat when lead is assigned to consultant
CREATE OR REPLACE FUNCTION create_chat_on_lead_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_consultant_id IS NOT NULL AND (OLD.assigned_consultant_id IS NULL OR OLD.assigned_consultant_id IS DISTINCT FROM NEW.assigned_consultant_id) THEN
        INSERT INTO maeum_chats (client_id, consultant_id)
        VALUES (
            (SELECT id FROM maeum_users WHERE email = NEW.email LIMIT 1),
            NEW.assigned_consultant_id
        )
        ON CONFLICT (client_id, consultant_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13.5 Log activity function
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO maeum_activity_log (user_id, action, entity_type, entity_id, changes, metadata, ip_address)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_changes, p_metadata, current_setting('request.headers')::json ->> 'x-forwarded-for')
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13.6 Get available spots for an experience on a given date
CREATE OR REPLACE FUNCTION get_experience_availability(
    p_experience_id UUID,
    p_date DATE,
    p_participants INT DEFAULT 1
) RETURNS TABLE (
    is_available BOOLEAN,
    available_spots INT,
    price_per_person NUMERIC,
    total_price NUMERIC
) AS $$
DECLARE
    base_price NUMERIC;
    adj_price NUMERIC;
    spots INT;
BEGIN
    SELECT e.price_per_person INTO base_price FROM maeum_experiences e WHERE e.id = p_experience_id;

    SELECT ea.available_spots, COALESCE(ea.price_adjustment, 0)
    INTO spots, adj_price
    FROM maeum_experience_availability ea
    WHERE ea.experience_id = p_experience_id AND ea.date = p_date;

    IF spots IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, base_price, base_price * p_participants;
    ELSE
        RETURN QUERY SELECT spots >= p_participants, spots, base_price + adj_price, (base_price + adj_price) * p_participants;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 14. SEED DATA
-- ============================================================================

-- 14.1 Users
INSERT INTO maeum_users (id, email, name, role, phone, is_active) VALUES
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@maeum.com', 'Super Administrador Maeum', 'super_admin', '+5541999999999', TRUE),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'consultora1@maeum.com', 'Mariana Santos', 'consultora', '+5541988888888', TRUE),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cliente@maeum.com', 'Bruno Almeida', 'customer', '+5541977777777', TRUE);

-- 14.2 Site Settings
INSERT INTO maeum_site_settings (key, value, description) VALUES
('site_info', '{
    "name": "Maeum Global",
    "tagline": "Turismo & Intercâmbio de Luxo na Ásia",
    "description": "Descubra a Ásia antes mesmo de embarcar. Roteiros personalizados, hotéis de luxo, experiências exclusivas e intercâmbio de alto padrão.",
    "keywords": ["Turismo de Luxo", "Viagem Coreia do Sul", "Viagem Japão", "Intercâmbio Coreia", "Maeum Global"],
    "locale": "pt-BR",
    "url": "https://maeumglobal.com.br"
}'::jsonb, 'Informações gerais do site'),
('visual_theme', '{
    "colors": {
        "primary": "#C8A27C",
        "secondary": "#1C1C1C",
        "accent": "#B8860B",
        "accentHover": "#8B6508",
        "text": "#1C1C1C",
        "background": "#FAF9F6",
        "card": "#FFFFFF"
    },
    "typography": {
        "titleFont": "Cormorant Garamond",
        "bodyFont": "Plus Jakarta Sans",
        "baseSize": "16px"
    },
    "logo_url": "/images/logo.png",
    "favicon_url": "/favicon.ico"
}'::jsonb, 'Tema visual do site (cores, tipografia, logo)'),
('contact_info', '{
    "phone": "+55 (41) 98709-4799",
    "whatsapp": "+5541987094799",
    "email": "contato@maeumglobal.com",
    "address": "Av. Batel 1230, Curitiba, PR, Brasil",
    "maps_coordinates": "-25.4445,-49.2882"
}'::jsonb, 'Informações de contato da empresa'),
('social_media', '{
    "instagram": "https://instagram.com/maeumglobal",
    "youtube": "https://youtube.com/maeumglobal",
    "pinterest": "https://pinterest.com/maeumglobal",
    "tiktok": "",
    "facebook": ""
}'::jsonb, 'Redes sociais'),
('seo_defaults', '{
    "title_suffix": " | Maeum Global Travel",
    "default_description": "Descubra roteiros de luxo exclusivos, intercâmbios e experiências na Ásia com a Maeum Global.",
    "og_image": "/images/og-default.jpg"
}'::jsonb, 'Configurações padrão de SEO'),
('legal_info', '{
    "company_name": "Maeum Global Travel S.L.",
    "privacy_email": "privacidade@maeumglobal.com",
    "legal_email": "juridico@maeumglobal.com",
    "finance_email": "financeiro@maeumglobal.com",
    "dpo_contact": "privacidade@maeumglobal.com",
    "response_days": 15
}'::jsonb, 'Informações legais e de privacidade');

-- 14.3 Payment Methods
INSERT INTO maeum_payment_methods (method, display_name, description, sort_order) VALUES
('pix', 'Pix', 'Pagamento instantâneo via Pix', 0),
('boleto', 'Boleto Bancário', 'Pagamento via boleto programado em até 48 vezes', 1),
('credit_card', 'Cartão de Crédito', 'Pagamento em até 24 vezes sem juros', 2);

-- 14.4 Destinations
INSERT INTO maeum_destinations (id, name, slug, country, description, short_description, main_image, gallery, map_coordinates, is_featured, sort_order, status) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coreia do Sul', 'coreia-do-sul', 'Coreia', 'Um país fascinante que combina palácios tradicionais de dinastias milenares com a cultura pop contemporânea, tecnologia de ponta e clínicas exclusivas de K-Beauty.', 'Tradição milenar encontra inovação futurista.', 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'], '{"lat": 37.5665, "lng": 126.9780}', TRUE, 0, 'published'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Japão', 'japao', 'Japão', 'Templos históricos, montanhas majestosas e metrópoles vibrantes. O Japão oferece uma harmonia perfeita entre tradição e modernidade.', 'Onde tradição e futuro dançam em perfeita harmonia.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800'], '{"lat": 35.6762, "lng": 139.6503}', TRUE, 1, 'published'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Vietnã', 'vietna', 'Vietnã', 'Paisagens naturais exuberantes, uma rica herança culinária e cidades vibrantes fazem do Vietnã um destino imperdível.', 'Natureza exuberante e cultura milenar.', 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800'], '{"lat": 21.0285, "lng": 105.8542}', TRUE, 2, 'published');

-- 14.5 Navigation Items
INSERT INTO maeum_navigation_items (id, parent_id, navigation_type, label, url, icon, sort_order) VALUES
('nav-01', NULL, 'main', 'Coreia do Sul', '/coreia-do-sul', NULL, 0),
('nav-02', NULL, 'main', 'Destinos', '/destinos', NULL, 1),
('nav-03', NULL, 'main', 'Experiências', '/coreia-do-sul/experiencias', NULL, 2),
('nav-04', NULL, 'main', 'Intercâmbio', '/coreia-do-sul/intercambio', NULL, 3),
('nav-05', NULL, 'main', 'Jornadas', '/coreia-do-sul/jornadas', NULL, 4),
('nav-06', NULL, 'main', 'Journal', '/journal', NULL, 5),
('nav-07', NULL, 'main', 'Contato', '/contato', NULL, 6);

-- 14.6 Blog Categories
INSERT INTO maeum_blog_categories (slug, name, description, color, sort_order) VALUES
('cultura', 'Cultura', 'Artigos sobre cultura coreana e asiática', '#C8A27C', 0),
('gastronomia', 'Gastronomia', 'Conteúdo sobre culinária e experiências gastronômicas', '#B8860B', 1),
('k-beauty', 'K-Beauty', 'Beleza e cuidados coreanos', '#D4A574', 2),
('intercambio', 'Intercâmbio', 'Dicas e informações sobre intercâmbio', '#8B6914', 3),
('viagem', 'Viagem', 'Guias e relatos de viagem', '#A0522D', 4);

-- 14.7 Blog Posts
INSERT INTO maeum_blog_posts (slug, title, summary, main_image, category_id, author_id, status, published_at) VALUES
('gyeongbokgung-palacio-real', 'Gyeongbokgung: O Palácio Real que Conta a História da Coreia', 'Conheça a história e os segredos do maior palácio da dinastia Joseon, no coração de Seul.', 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800', (SELECT id FROM maeum_blog_categories WHERE slug = 'cultura'), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'published', NOW()),
('mercado-gwangjang-seul', 'Mercado Gwangjang: O Paraíso Gastronômico de Seul', 'Descubra os sabores autênticos da Coreia no mercado mais vibrante de Seul.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800', (SELECT id FROM maeum_blog_categories WHERE slug = 'gastronomia'), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'published', NOW()),
('kyoto-templos-japao', 'Guia dos Templos Imperdíveis em Kyoto', 'Um roteiro pelos templos mais impressionantes da antiga capital do Japão.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800', (SELECT id FROM maeum_blog_categories WHERE slug = 'viagem'), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'published', NOW());

-- 14.8 Experiences Categories
INSERT INTO maeum_categories (slug, name, description, icon, color, sort_order) VALUES
('historia-e-cultura', 'História e Cultura', 'Explore a rica história e tradições coreanas', 'Landmark', '#8B0000', 0),
('gastronomia', 'Gastronomia', 'Sabores autênticos da culinária coreana', 'UtensilsCrossed', '#B8860B', 1),
('seul-e-vida-urbana', 'Seul e Vida Urbana', 'Descubra a energia vibrante da capital', 'Building', '#C8A27C', 2),
('bem-estar', 'Bem-estar', 'Cuide do corpo e da mente', 'Heart', '#D4A574', 3),
('tradicao-coreana', 'Tradição Coreana', 'Imersão nas tradições milenares', 'Scroll', '#8B6914', 4),
('experiencias-sensoriais', 'Experiências Sensoriais', 'Desperte todos os seus sentidos', 'Sparkles', '#A0522D', 5),
('k-beauty', 'K-Beauty', 'Beleza e cuidados coreanos', 'Palette', '#D4A574', 6),
('hanbok-e-design', 'Hanbok e Design', 'Descubra a elegância do vestuário tradicional', 'Shirt', '#8B0000', 7);

-- 14.9 Experience Seed Data
INSERT INTO maeum_experiences (id, slug, title, subtitle, location, category_slugs, description, highlights, included, duration_hours, price_per_person, main_image, gallery, booking_type, available_from, status) VALUES
('exp-01', 'seul-depois-do-por-do-sol', 'Seul Depois do Pôr do Sol', 'Uma noite pela energia de Seul: mercados, gastronomia de rua e vida noturna autêntica.', 'Seul', ARRAY['gastronomia', 'seul-e-vida-urbana'], 'Explore Seul quando a cidade se transforma. O Pôr do Sol revela uma nova energia: mercados noturnos iluminados, barracas de rua com aromas irresistíveis e ruas pulsando com música e conversas.', ARRAY['Caminhada noturna por mercados tradicionais', 'Degustação de comida de rua coreana', 'Roteiro por pontos icônicos de Seul à noite'], ARRAY['Experiência guiada', 'Roteiro noturno por Seul', 'Experiência gastronômica conforme o roteiro', 'Acompanhamento durante a atividade'], 4, 690, 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800'], 'direct', '2026-08-25', 'published'),
('exp-02', 'palacio-historia-e-hanbok', 'Palácio, História e Hanbok', 'Conheça a história coreana através dos palácios e da tradição do hanbok.', 'Seul', ARRAY['historia-e-cultura'], 'Uma experiência para mergulhar na história coreana através da visita aos palácios centenários e da descoberta do hanbok, o vestuário tradicional coreano.', ARRAY['Visita guiada aos palácios históricos', 'Contextualização histórica detalhada', 'Contato com a tradição do hanbok'], ARRAY['Experiência guiada', 'Visita ao palácio previsto no roteiro', 'Contextualização histórica', 'Acompanhamento durante a atividade'], 4, 490, 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800'], 'request', '2026-08-25', 'published'),
('exp-03', 'uma-noite-as-margens-do-han', 'Uma Noite às Margens do Han', 'Piquenique, convivência e um cruzeiro sob as luzes de Seul.', 'Rio Han, Seul', ARRAY['seul-e-vida-urbana'], 'Viva uma noite inesquecível às margens do Rio Han com piquenique, momentos de convivência e um cruzeiro noturno.', ARRAY['Experiência no Rio Han', 'Piquenique à beira do rio', 'Cruzeiro noturno'], ARRAY['Experiência no Rio Han', 'Piquenique conforme a programação', 'Cruzeiro noturno conforme o roteiro'], 4, 850, 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', ARRAY['https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800'], 'direct', '2026-08-25', 'published');

-- 14.10 Exchange Institution
INSERT INTO maeum_exchange_institutions (id, name, slug, description, country, features, is_active, is_featured) VALUES
('inst-01', 'Lexis Korea', 'lexis-korea', 'Escola de idiomas premium na Coreia do Sul, com campi em Gangnam, Hongdae e Busan. Reconhecida pela excelência no ensino de coreano para estrangeiros com mais de 15 anos de experiência.', 'Coreia do Sul', ARRAY['Escola reconhecida internacionalmente', 'Professores nativos qualificados', 'Turmas reduzidas', 'Atividades culturais regulares', 'Suporte ao estudante', 'Certificado de conclusão'], TRUE, TRUE);

-- 14.11 Exchange Campuses
INSERT INTO maeum_exchange_campuses (id, institution_id, name, city, location, description, main_image, features) VALUES
('camp-01', 'inst-01', 'Gangnam', 'Seul', 'Gangnam-gu, Seul', 'Campus principal no coração de Gangnam, o distrito mais sofisticado de Seul. Estrutura moderna com salas de aula equipadas, área de estudo e lounge.', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800', ARRAY['Estrutura moderna', 'Localização central em Gangnam', 'Salas equipadas', 'Área de estudo', 'Lounge para estudantes']),
('camp-02', 'inst-01', 'Hongdae', 'Seul', 'Mapo-gu, Seul', 'Campus no vibrante bairro de Hongdae, conhecido pela cultura jovem, arte de rua e vida noturna.', 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', ARRAY['Ambiente criativo', 'Cultura jovem', 'Arte de rua', 'Vida noturna vibrante']),
('camp-03', 'inst-01', 'Busan', 'Busan', 'Haeundae-gu, Busan', 'Campus à beira-mar em Busan, na região de Haeundae. Estude coreano com vista para o oceano.', 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', ARRAY['Vista para o mar', 'Ambiente relaxado', 'Praia de Haeundae', 'Estrutura completa']);

-- 14.12 Exchange Programs
INSERT INTO maeum_exchange_programs (id, institution_id, name, slug, description, classes_per_week, duration_weeks_min, duration_weeks_max, level_required, pricing_tiers, includes_enrollment_fee, enrollment_fee, includes_material, cultural_activities) VALUES
('prog-01', 'inst-01', 'Intensive Korean', 'intensive-korean', 'Programa intensivo de coreano com 20 aulas por semana. Ideal para quem deseja aprender o idioma de forma rápida e imersiva.', 20, 1, 52, 'Todos os níveis', '[
    {"range": "1-9", "min": 1, "max": 9, "price_per_week": 375000, "currency": "KRW"},
    {"range": "10-19", "min": 10, "max": 19, "price_per_week": 365000, "currency": "KRW"},
    {"range": "20-29", "min": 20, "max": 29, "price_per_week": 355000, "currency": "KRW"},
    {"range": "30+", "min": 30, "max": 999, "price_per_week": 345000, "currency": "KRW"}
]'::jsonb, TRUE, 100000, TRUE, TRUE),
('prog-02', 'inst-01', 'Standard Korean', 'standard-korean', 'Programa regular de coreano com 15 aulas por semana. Equilíbrio entre aprendizado do idioma e tempo livre para explorar a Coreia.', 15, 1, 52, 'Todos os níveis', '[
    {"range": "1-9", "min": 1, "max": 9, "price_per_week": 295000, "currency": "KRW"},
    {"range": "10-19", "min": 10, "max": 19, "price_per_week": 285000, "currency": "KRW"},
    {"range": "20-29", "min": 20, "max": 29, "price_per_week": 275000, "currency": "KRW"},
    {"range": "30+", "min": 30, "max": 999, "price_per_week": 265000, "currency": "KRW"}
]'::jsonb, TRUE, 100000, FALSE, TRUE);

-- 14.13 Journeys
INSERT INTO maeum_journeys (id, slug, title, subtitle, concept, destinations, duration_days, total_spots, accommodation, price_per_person, main_image, included, itinerary, highlights, payment_options, status, category) VALUES
('jour-01', 'cheotnun-a-magia-da-primeira-neve-na-coreia', 'Cheotnun — A Magia da Primeira Neve na Coreia', 'Viva a magia da primeira neve na Coreia com acompanhamento exclusivo Maeum Global.', 'A primeira neve na Coreia é mais que um fenômeno meteorológico — é um momento de renovação, beleza e significado cultural.', ARRAY['Seul'], 10, 12, 'Hotel 4 estrelas', 32000, 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800',
ARRAY['Passagem aérea internacional', 'Seguro viagem', 'Hospedagem em hotel 4 estrelas', 'Transfers', 'Acompanhamento durante a jornada', 'Suporte em português', 'Palácio Gyeongbokgung', 'Experiência hanbok', 'Bukchon Hanok Village', 'Herb Island', 'Experiência K-Beauty Cheotnun', 'Jisan Ski Resort'],
'[
    {"day": 1, "title": "Chegada a Seul", "description": "Recepção no aeroporto de Incheon e traslado para o hotel."},
    {"day": 2, "title": "Palácio Gyeongbokgung e Hanbok", "description": "Experiência de hanbok e visita ao palácio."},
    {"day": 3, "title": "Myeongdong e K-Beauty", "description": "Experiência K-Beauty parceira Cheotnun."},
    {"day": 4, "title": "Herb Island", "description": "Excursão para Herb Island."},
    {"day": 5, "title": "Jisan Ski Resort", "description": "Dia de neve e atividades de inverno."},
    {"day": 10, "title": "Retorno", "description": "Traslado para o aeroporto e voo de retorno."}
]'::jsonb,
'[
    {"title": "Herb Island", "description": "Um dos destinos de inverno mais encantadores da Coreia."},
    {"title": "K-Beauty Cheotnun", "description": "Experiência K-Beauty parceira inclusa."},
    {"title": "Jisan Ski Resort", "description": "Experiência de inverno completa."}
]'::jsonb,
'{"pix": true, "boleto_parcelas": 48, "credit_card_parcelas": 24, "credit_card_juros_parcelas": "25-48", "credit_card_juros_taxa": 0.05}'::jsonb,
'published', 'premium');

-- 14.14 Journey Departures
INSERT INTO maeum_journey_departures (journey_id, start_date, end_date, total_spots, available_spots, status, notes) VALUES
('jour-01', '2027-01-10', '2027-01-20', 12, 12, 'available', 'Primeira saída Cheotnun');

-- 14.15 Testimonials
INSERT INTO maeum_testimonials (author_name, author_role, content, rating, is_featured) VALUES
('Juliana Costa', 'Cliente Maeum', 'A experiência na Coreia superou todas as expectativas. Cada detalhe foi pensado com carinho, desde a escolha dos restaurantes até as atividades culturais.', 5, TRUE),
('Rafaela Oliveira', 'Cliente Maeum', 'Fiz o intercâmbio na Lexis Korea através da Maeum e foi a melhor decisão. O suporte em português fez toda a diferença.', 5, TRUE),
('Camila Santos', 'Cliente Maeum', 'A jornada Cheotnun foi mágica. A neve, a cultura, as novas amigas... Uma experiência que vou levar para a vida toda.', 5, TRUE);

-- 14.16 FAQ
INSERT INTO maeum_faq_items (question, answer, category, sort_order) VALUES
('Como funciona o processo de reserva?', 'Após escolher sua experiência, você pode reservar diretamente pelo site ou solicitar que uma consultora entre em contato para um atendimento personalizado.', 'Reservas', 0),
('Quanto tempo antes devo reservar?', 'Recomendamos reservar com pelo menos 30 dias de antecedência para garantir disponibilidade. Para jornadas em grupo, as vagas são limitadas.', 'Reservas', 1),
('Quais formas de pagamento são aceitas?', 'Trabalhamos com Pix, boleto bancário em até 48 vezes e cartão de crédito em até 24 vezes sem juros.', 'Pagamentos', 2),
('Preciso de visto para viajar para a Coreia?', 'Cidadãos brasileiros não precisam de visto para estadias de até 90 dias na Coreia do Sul. Para intercâmbios, podemos auxiliar com o visto de estudante.', 'Documentação', 3),
('O que está incluído nos preços das experiências?', 'Cada experiência lista claramente o que está incluso. Em geral, incluem guia, atividades descritas e equipamentos necessários.', 'Experiências', 4);

-- ============================================================================
-- 15. FINAL NOTES
-- ============================================================================
-- This schema is designed for Supabase (PostgreSQL) and includes:
-- - 40+ tables covering all business domains
-- - Row Level Security with role-based policies
-- - Automated triggers for audit trail and data integrity
-- - Helper functions for common queries
-- - Comprehensive indexing for performance
-- - Seed data for immediate testing
-- ============================================================================
