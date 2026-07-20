const STORAGE_KEY = 'maeum_db_v1';

interface DbState {
  users: any[];
  destinations: any[];
  packages: any[];
  crm_leads: any[];
  proposals: any[];
  proposal_versions: any[];
  trips: any[];
  documents: any[];
  chats: any[];
  chat_messages: any[];
  cms_blocks: any[];
  system_settings: Record<string, any>;
  categories: any[];
  experiences: any[];
  kbeauty_partners: any[];
  kbeauty_experiences: any[];
  exchange_institutions: any[];
  exchange_campuses: any[];
  exchange_programs: any[];
  journeys: any[];
  journey_departures: any[];
  experience_availability: any[];
  blog_posts: any[];
  testimonials: any[];
  faq_items: any[];
  navigation_items: any[];
  cms_pages: any[];
  site_config: Record<string, any>;
}

const DEFAULT_STATE: DbState = {
  users: [
    { id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', email: 'admin@maeum.com', name: 'Super Administrador Maeum', role: 'super_admin', phone: '+5541999999999', avatar_url: null },
    { id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'consultora1@maeum.com', name: 'Mariana Santos', role: 'consultora', phone: '+5541988888888', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200' },
    { id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', email: 'cliente@maeum.com', name: 'Bruno Almeida', role: 'customer', phone: '+5541977777777', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' }
  ],
  destinations: [
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Coreia do Sul', slug: 'coreia-do-sul', country: 'Coreia', description: 'Um país fascinante que mistura tradição milenar com modernidade futurista.', main_image: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'], map_coordinates: { lat: 37.5665, lng: 126.9780 }, video_url: null, is_featured: true, seo_title: 'Viaje para a Coreia do Sul | Maeum Global', seo_description: 'Descubra roteiros de luxo exclusivos para a Coreia do Sul.' },
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'Japão', slug: 'japao', country: 'Japão', description: 'Templos históricos, montanhas majestosas e metrópoles vibrantes.', main_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800'], map_coordinates: { lat: 35.6762, lng: 139.6503 }, video_url: null, is_featured: true, seo_title: 'Roteiros de Luxo no Japão | Maeum Global', seo_description: 'Experimente o melhor do Japão tradicional e moderno com a Maeum.' },
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Vietnã', slug: 'vietna', country: 'Vietnã', description: 'Paisagens naturais exuberantes e ricas experiências culinárias.', main_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800'], map_coordinates: { lat: 21.0285, lng: 105.8542 }, video_url: null, is_featured: true, seo_title: 'Descubra o Vietnã | Maeum Global', seo_description: 'Passeios personalizados de alto padrão pelo Vietnã.' }
  ],
  packages: [
    {
      id: 'c1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      destination_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Essência da Coreia do Sul',
      slug: 'essencia-da-coreia-do-sul',
      price: 3500.00,
      start_dates: ['2026-10-15', '2026-11-20'],
      end_dates: ['2026-10-25', '2026-11-30'],
      description: 'Pacote de 10 dias explorando Seul, Busan e Gyeongju com hotéis de alto padrão e guias nativos.',
      gallery: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'],
      video_url: null,
      itinerary: [
        { day: 1, title: 'Chegada em Seul', description: 'Recepção no aeroporto de Incheon e traslado privativo para o hotel de luxo.' },
        { day: 2, title: 'Palácios Tradicionais e Hanbok', description: 'Visita guiada ao Palácio Gyeongbokgung com aluguel de Hanbok.' },
        { day: 3, title: 'Modernidade e Vlogs', description: 'Passeio por Hongdae, N Seoul Tower e jantar Korean BBQ.' }
      ],
      included: ['Traslado privativo', 'Hospedagem 5 estrelas', 'Guia bilíngue', 'Ingressos'],
      not_included: ['Passagens aéreas', 'Seguro viagem', 'Alimentação livre'],
      status: 'active'
    }
  ],
  crm_leads: [
    { id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Bruno Almeida', phone: '+5541977777777', email: 'cliente@maeum.com', interest_destination: 'Coreia do Sul', origin: 'Site / Formulário Destinos', status: 'proposal', assigned_consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', notes: 'Lead muito interessado em intercâmbio e viagem.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  proposals: [
    {
      id: 'f1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', lead_id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Viagem de Luxo - Coreia de Bruno', status: 'sent', total_amount: 4200.00, unique_link: 'viagem-bruno-seul-2026', version: 1,
      items: [
        { type: 'package', name: 'Essência da Coreia do Sul', price: 3500.00, details: '10 Dias com guias exclusivos' },
        { type: 'insurance', name: 'Seguro Viagem Global Premium', price: 150.00, details: 'Cobertura médica internacional' },
        { type: 'ktx_pass', name: 'KTX Rail Pass - 5 dias', price: 200.00, details: 'Passagens ilimitadas de trem-bala' },
        { type: 'wifi_chip', name: 'Chip eSIM Dados Ilimitados', price: 50.00, details: '4G/5G ilimitada' },
        { type: 'extra_tour', name: 'Sessão de Fotos em Bukchon', price: 300.00, details: 'Ensaio fotográfico privativo de 2 horas' }
      ],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  ],
  proposal_versions: [],
  trips: [
    {
      id: 'trip-1', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', package_id: 'c1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Roteiro dos Sonhos: Coreia do Sul 2026', start_date: '2026-10-15', end_date: '2026-10-25',
      timeline: [
        { date: '2026-10-15', time: '14:00', title: 'Check-in Hotel Four Seasons', description: 'Suíte deluxe.' },
        { date: '2026-10-16', time: '09:00', title: 'Tour Palácios Reais', description: 'Passeio privativo guiado em português.' },
        { date: '2026-10-17', time: '11:00', title: 'Skincare K-Beauty', description: 'Visita à clínica estética de luxo.' }
      ],
      payments: [
        { due_date: '2026-08-15', amount: 2100.00, status: 'paid', invoice_url: '/invoices/inv-001.pdf' },
        { due_date: '2026-09-15', amount: 2100.00, status: 'pending', invoice_url: '/invoices/inv-002.pdf' }
      ],
      status: 'preparation', created_at: new Date().toISOString()
    }
  ],
  documents: [
    { id: 'doc-1', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', uploaded_by: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', file_name: 'Passaporte_Bruno.pdf', file_url: '/uploads/docs/passaporte-bruno.pdf', file_size: 1048576, category: 'passport', created_at: new Date().toISOString() }
  ],
  chats: [
    { id: 'chat-1', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', created_at: new Date().toISOString() }
  ],
  chat_messages: [
    { id: 'msg-1', chat_id: 'chat-1', sender_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', content: 'Olá Bruno! Criei uma proposta exclusiva para a sua viagem para a Coreia. Dê uma olhada no seu painel!', attachment_url: null, attachment_type: null, read_at: new Date().toISOString(), created_at: new Date().toISOString() }
  ],
  cms_blocks: [
    {
      id: 'block-hero-maeum', page_name: 'home', section_id: 'hero', block_type: 'hero',
      content: {
        title: 'Descubra a Ásia antes mesmo de embarcar.',
        subtitle: 'Histórias, dicas e experiências reais para transformar sua viagem de luxo.',
        btnText: 'ASSISTIR AO VÍDEO INSTITUCIONAL',
        btnLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        bgImage: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1920'
      },
      sort_order: 0, active: true
    }
  ],
  categories: [
    { id: 'cat-01', slug: 'historia-e-cultura', name: 'História e Cultura', destination: 'Coreia do Sul', active: true, sort_order: 0 },
    { id: 'cat-02', slug: 'gastronomia', name: 'Gastronomia', destination: 'Coreia do Sul', active: true, sort_order: 1 },
    { id: 'cat-03', slug: 'seul-e-vida-urbana', name: 'Seul e Vida Urbana', destination: 'Coreia do Sul', active: true, sort_order: 2 },
    { id: 'cat-04', slug: 'bem-estar', name: 'Bem-estar', destination: 'Coreia do Sul', active: true, sort_order: 3 },
    { id: 'cat-05', slug: 'tradicao-coreana', name: 'Tradição Coreana', destination: 'Coreia do Sul', active: true, sort_order: 4 },
    { id: 'cat-06', slug: 'experiencias-sensoriais', name: 'Experiências Sensoriais', destination: 'Coreia do Sul', active: true, sort_order: 5 },
    { id: 'cat-07', slug: 'k-beauty', name: 'K-Beauty', destination: 'Coreia do Sul', active: true, sort_order: 6 },
    { id: 'cat-08', slug: 'hanbok-e-design', name: 'Hanbok e Design', destination: 'Coreia do Sul', active: true, sort_order: 7 }
  ],
  experiences: [
    { id: 'exp-01', slug: 'seul-depois-do-por-do-sol', title: 'Seul Depois do Pôr do Sol', subtitle: 'Uma noite pela energia de Seul: mercados, gastronomia de rua e vida noturna autêntica.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['gastronomia', 'seul-e-vida-urbana'], description: 'Explore Seul quando a cidade se transforma.', highlights: ['Caminhada noturna por mercados tradicionais', 'Degustação de comida de rua coreana', 'Roteiro por pontos icônicos'], included: ['Experiência guiada', 'Roteiro noturno', 'Acompanhamento'], duration_hours: 4, price_per_person: 690, main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800'], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-02', slug: 'palacio-historia-e-hanbok', title: 'Palácio, História e Hanbok', subtitle: 'Conheça a história coreana através dos palácios.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['historia-e-cultura'], description: 'Mergulhe na história coreana visitando palácios centenários.', highlights: ['Visita guiada', 'Contextualização histórica', 'Hanbok'], included: ['Experiência guiada', 'Visita ao palácio', 'Acompanhamento'], duration_hours: 4, price_per_person: 490, main_image: 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'request', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-03', slug: 'uma-noite-as-margens-do-han', title: 'Uma Noite às Margens do Han', subtitle: 'Piquenique e cruzeiro sob as luzes de Seul.', location: 'Rio Han, Seul', region: 'Seul', city: 'Seul', category_slugs: ['seul-e-vida-urbana'], description: 'Noite inesquecível às margens do Rio Han.', highlights: ['Piquenique', 'Cruzeiro noturno', 'Convivência'], included: ['Piquenique', 'Cruzeiro', 'Acompanhamento'], duration_hours: 4, price_per_person: 850, main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-04', slug: 'entre-duas-coreias-dmz', title: 'Entre Duas Coreias — DMZ', subtitle: 'Experiência histórica pela região desmilitarizada.', location: 'Cheorwon', region: 'Cheorwon', city: 'Cheorwon', category_slugs: ['historia-e-cultura'], description: 'Jornada pela DMZ para compreender a divisão da Coreia.', highlights: ['Tour em grupo pequeno', 'DMZ', 'Contextualização'], included: ['Tour', 'Visitas históricas', 'Acompanhamento'], duration_hours: 9, price_per_person: 1050, main_image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'request', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-05', slug: 'seul-privada-dia-inteiro-i', title: 'Seul Privada — Dia Inteiro I', subtitle: 'Dia inteiro explorando Seul com exclusividade.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['seul-e-vida-urbana'], description: 'Tour privado de dia inteiro por Seul.', highlights: ['Tour privado', 'Roteiro personalizado', 'Veículo privativo'], included: ['Tour privado', 'Veículo', 'Acompanhamento'], duration_hours: 9, price_per_person: 1390, main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'request', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-06', slug: 'seul-privada-dia-inteiro-ii', title: 'Seul Privada — Dia Inteiro II', subtitle: 'Segunda imersão privada em Seul.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['seul-e-vida-urbana'], description: 'Roteiro complementar ao primeiro dia inteiro.', highlights: ['Tour privado', 'Roteiro complementar', 'Imersão'], included: ['Tour privado', 'Veículo', 'Acompanhamento'], duration_hours: 9, price_per_person: 1100, main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'request', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-07', slug: 'a-historia-servida-em-uma-tigela-makgeolli', title: 'A História Servida em uma Tigela — Makgeolli', subtitle: 'História, tradição artesanal e degustação.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['gastronomia', 'tradicao-coreana'], description: 'Descubra o makgeolli, bebida tradicional coreana.', highlights: ['Makgeolli artesanal', 'Degustação guiada', 'História'], included: ['Experiência', 'Degustação', 'Acompanhamento'], duration_hours: 2, price_per_person: 630, main_image: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-08', slug: 'a-memoria-de-um-aroma-perfume-em-um-hanok', title: 'A Memória de um Aroma — Perfume em Hanok', subtitle: 'Crie sua fragrância em um hanok.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['experiencias-sensoriais'], description: 'Crie sua própria fragrância em um hanok.', highlights: ['Perfumista', 'Fragrância pessoal', 'Hanok'], included: ['Experiência', 'Criação de fragrância', 'Acompanhamento'], duration_hours: 1.5, price_per_person: 420, main_image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-09', slug: 'o-tempo-de-cuidar-cha-coreano-e-spa-para-os-pes', title: 'O Tempo de Cuidar — Chá Coreano e Spa', subtitle: 'Bem-estar com chá de ervas e spa para os pés.', location: 'Seul', region: 'Seul', city: 'Seul', category_slugs: ['bem-estar'], description: 'Pausa de bem-estar com chá coreano e spa.', highlights: ['Chá de ervas', 'Spa para os pés', 'Bem-estar'], included: ['Chá', 'Spa', 'Acompanhamento'], duration_hours: 2.5, price_per_person: 460, main_image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() },
    { id: 'exp-10', slug: 'o-hanbok-que-conta-quem-voce-e', title: 'O Hanbok que Conta Quem Você É', subtitle: 'Descubra o hanbok da sua personalidade.', location: 'Insadong, Seul', region: 'Seul', city: 'Seul', category_slugs: ['hanbok-e-design'], description: 'Encontre o hanbok que expressa quem você é.', highlights: ['Designer especializada', 'Hanbok', 'Estilo pessoal'], included: ['Orientação', 'Experiência', 'Acompanhamento'], duration_hours: 2, price_per_person: 460, main_image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'direct', available_from: '2026-08-25', created_at: new Date().toISOString() }
  ],
  kbeauty_partners: [
    { id: 'kb-partner-01', name: 'Cheotnun Parceria K-Beauty', description: 'Parceira K-Beauty da Cheotnun.', active: true, created_at: new Date().toISOString() }
  ],
  kbeauty_experiences: [
    { id: 'kb-exp-01', slug: 'sua-pele-o-cuidado-coreano', title: 'Sua Pele, o Cuidado Coreano', subtitle: 'Cuidados com a pele e maquiagem K-Beauty.', location: 'Seul', region: 'Seul', city: 'Seul', partner_id: null, description: 'Imersão em cuidados com a pele K-Beauty.', highlights: ['Profissional especializada', 'Skincare', 'Maquiagem K-Beauty'], included: ['Orientação', 'Skincare', 'Maquiagem'], duration_hours: 2, price_per_person: 1050, main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800', gallery: [], video_url: '', video_embed: '', status: 'active', booking_type: 'request', available_from: '2026-08-25', is_partner_experience: false, is_included_in_journey: false, created_at: new Date().toISOString() }
  ],
  exchange_institutions: [
    { id: 'inst-01', name: 'Lexis Korea', slug: 'lexis-korea', description: 'Escola de idiomas premium na Coreia do Sul.', country: 'Coreia do Sul', website: 'https://lexiskorea.com', logo_url: '', active: true, created_at: new Date().toISOString() }
  ],
  exchange_campuses: [
    { id: 'camp-01', institution_id: 'inst-01', name: 'Gangnam', city: 'Seul', location: 'Gangnam-gu, Seul', description: 'Campus principal em Gangnam.', main_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800', active: true },
    { id: 'camp-02', institution_id: 'inst-01', name: 'Hongdae', city: 'Seul', location: 'Mapo-gu, Seul', description: 'Campus no bairro vibrante de Hongdae.', main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', active: true },
    { id: 'camp-03', institution_id: 'inst-01', name: 'Busan', city: 'Busan', location: 'Haeundae-gu, Busan', description: 'Campus à beira-mar em Busan.', main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', active: true }
  ],
  exchange_programs: [
    { id: 'prog-01', institution_id: 'inst-01', campus_id: 'camp-01', name: 'Intensive Korean', slug: 'intensive-korean', description: 'Programa intensivo de coreano.', duration_weeks_min: 1, duration_weeks_max: 52, classes_per_week: 20, level_required: 'Todos os níveis', pricing_tiers: [{ range: '1-9', min: 1, max: 9, price_per_week: 375000, currency: 'KRW' }, { range: '10-19', min: 10, max: 19, price_per_week: 365000, currency: 'KRW' }, { range: '20-29', min: 20, max: 29, price_per_week: 355000, currency: 'KRW' }, { range: '30+', min: 30, max: 999, price_per_week: 345000, currency: 'KRW' }], includes_enrollment_fee: true, enrollment_fee: 100000, enrollment_fee_currency: 'KRW', includes_material: true, material_fee: 50000, material_fee_currency: 'KRW', cultural_activities: true, active: true },
    { id: 'prog-02', institution_id: 'inst-01', campus_id: 'camp-02', name: 'Standard Korean', slug: 'standard-korean', description: 'Programa regular de coreano.', duration_weeks_min: 1, duration_weeks_max: 52, classes_per_week: 15, level_required: 'Todos os níveis', pricing_tiers: [{ range: '1-9', min: 1, max: 9, price_per_week: 295000, currency: 'KRW' }, { range: '10-19', min: 10, max: 19, price_per_week: 285000, currency: 'KRW' }, { range: '20-29', min: 20, max: 29, price_per_week: 275000, currency: 'KRW' }, { range: '30+', min: 30, max: 999, price_per_week: 265000, currency: 'KRW' }], includes_enrollment_fee: true, enrollment_fee: 100000, enrollment_fee_currency: 'KRW', includes_material: false, material_fee: 0, material_fee_currency: 'KRW', cultural_activities: true, active: true }
  ],
  journeys: [
    { id: 'jour-01', slug: 'cheotnun-a-magia-da-primeira-neve-na-coreia', title: 'Cheotnun — A Magia da Primeira Neve na Coreia', subtitle: 'Viva a magia da primeira neve na Coreia.', concept: 'Cheotnun convida você a viver o inverno coreano.', destinations: ['Seul'], duration_days: 10, total_spots: 12, accommodation: 'Hotel 4 estrelas', price_per_person: 32000, price_currency: 'BRL', main_image: 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800', gallery: [], video_url: '', video_embed: '', included: ['Passagem aérea', 'Seguro viagem', 'Hospedagem', 'Transfers', 'Acompanhamento'], not_included: ['Despesas pessoais', 'Alimentação não especificada'], itinerary: [{ day: 1, title: 'Chegada a Seul', description: 'Recepção e traslado.' }, { day: 10, title: 'Retorno', description: 'Voo de retorno.' }], highlights: [{ title: 'Primeira Neve', description: 'Experiência mágica de inverno.', image: 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800' }], payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 }, status: 'active', category: 'premium', created_at: new Date().toISOString() },
    { id: 'jour-02', slug: 'caravana-de-verao-2027-seul-e-busan', title: 'Caravana de Verão 2027 — Seul e Busan', subtitle: '10 dias explorando Seul e Busan no verão.', concept: 'Verão coreano vibrante com festivais e praias.', destinations: ['Seul', 'Busan'], duration_days: 10, total_spots: 20, accommodation: 'Hotel 4 estrelas', price_per_person: 29000, price_currency: 'BRL', main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', gallery: [], video_url: '', video_embed: '', included: ['Hospedagem', 'Transfers', 'Acompanhamento'], not_included: ['Passagens aéreas', 'Seguro viagem'], itinerary: [{ day: 1, title: 'Chegada', description: 'Recepção.' }, { day: 10, title: 'Retorno', description: 'Voo de retorno.' }], highlights: [{ title: 'Sky Capsule Busan', description: 'Experiência icônica.', image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800' }], payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 }, status: 'active', category: 'premium', created_at: new Date().toISOString(), categories: [{ name: 'Liberty', price: 29000, description: 'Experiência completa.' }, { name: 'Prestige', price: 34000, description: 'Experiência premium.' }] },
    { id: 'jour-03', slug: 'projeto-army-2027-always-destination', title: 'Projeto ARMY 2027 — Always Destination', subtitle: '15 dias em Seul, Busan e Daegu.', concept: 'Curadoria de experiências para ARMYs.', destinations: ['Seul', 'Busan', 'Daegu'], duration_days: 15, total_spots: 15, accommodation: 'Casa ARMY', price_per_person: 39000, price_currency: 'BRL', main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', gallery: [], video_url: '', video_embed: '', included: ['Passagem aérea', 'Hospedagem Casa ARMY', 'KTX', 'Acompanhamento'], not_included: ['Seguro viagem', 'Despesas pessoais'], itinerary: [{ day: 1, title: 'Chegada', description: 'Recepção.' }, { day: 15, title: 'Retorno', description: 'Voo de retorno.' }], highlights: [{ title: 'Pulseira em Gangnam', description: 'Experiência exclusiva.', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800' }], payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 }, status: 'active', category: 'army', created_at: new Date().toISOString() },
    { id: 'jour-04', slug: 'projeto-army-2027-the-horizon-of-seven-jeju', title: 'Projeto ARMY 2027 — The Horizon of Seven — Jeju Edition', subtitle: '15 dias: Seul, Busan e Ilha de Jeju.', concept: 'Experiência ARMY completa com Jeju.', destinations: ['Seul', 'Busan', 'Ilha de Jeju'], duration_days: 15, total_spots: 15, accommodation: 'Casa ARMY + Jeju', price_per_person: 42000, price_currency: 'BRL', main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', gallery: [], video_url: '', video_embed: '', included: ['Passagem aérea', 'Hospedagem', 'Voos internos', 'Acompanhamento'], not_included: ['Seguro viagem', 'Despesas pessoais'], itinerary: [{ day: 1, title: 'Chegada', description: 'Recepção.' }, { day: 15, title: 'Retorno', description: 'Voo de retorno.' }], highlights: [{ title: 'Cavalgada em Jeju', description: 'Experiência única.', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800' }], payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 }, status: 'active', category: 'army', created_at: new Date().toISOString() }
  ],
  journey_departures: [
    { id: 'dep-01', journey_id: 'jour-01', start_date: '2027-01-10', end_date: '2027-01-20', total_spots: 12, available_spots: 12, status: 'available', notes: 'Primeira saída Cheotnun', price_adjustment: 0, created_at: new Date().toISOString() },
    { id: 'dep-02', journey_id: 'jour-03', start_date: '2027-04-10', end_date: '2027-04-25', total_spots: 15, available_spots: 15, status: 'available', notes: 'Primeira saída Always Destination', price_adjustment: 0, created_at: new Date().toISOString() },
    { id: 'dep-03', journey_id: 'jour-03', start_date: '2027-06-10', end_date: '2027-06-25', total_spots: 15, available_spots: 15, status: 'available', notes: 'Segunda saída Always Destination', price_adjustment: 0, created_at: new Date().toISOString() },
    { id: 'dep-04', journey_id: 'jour-04', start_date: '2027-05-05', end_date: '2027-05-20', total_spots: 15, available_spots: 15, status: 'available', notes: 'Primeira saída Seven Jeju', price_adjustment: 0, created_at: new Date().toISOString() },
    { id: 'dep-05', journey_id: 'jour-04', start_date: '2027-07-07', end_date: '2027-07-22', total_spots: 15, available_spots: 15, status: 'available', notes: 'Segunda saída Seven Jeju', price_adjustment: 0, created_at: new Date().toISOString() }
  ],
  experience_availability: [],
  system_settings: {
    visual_theme: {
      colors: { primary: '#C8A27C', secondary: '#1C1C1C', accent: '#B8860B', accentHover: '#8B6508', text: '#1C1C1C', background: '#FAF9F6', card: '#FFFFFF' },
      typography: { titleFont: 'Cormorant Garamond', bodyFont: 'Plus Jakarta Sans', baseSize: '16px' },
      logo_url: '/logo-maeum.png',
      favicon_url: '/favicon-maeum.ico'
    },
    company_details: {
      name: 'Maeum Global Travel S.L.', phone: '+55 (41) 98709-4799', whatsapp: '+5541987094799',
      email: 'contato@maeumglobal.com', address: 'Av. Batel 1230, Curitiba, PR, Brasil',
      social: { instagram: 'https://instagram.com/maeumglobal', youtube: 'https://youtube.com/maeumglobal' }
    }
  },
  blog_posts: [
    { id: '1', title: 'Como Planejar sua Viagem de Luxo a Seul', author: 'Mariana Santos', created_at: '2026-07-08' },
    { id: '2', title: 'Top 5 Templos Tradicionais em Quioto', author: 'Bruno Almeida', created_at: '2026-07-09' }
  ],
  testimonials: [
    { id: 'test-01', name: 'Ana Beatriz', destination: 'Coreia do Sul - 2026', text: 'A Maeum tornou meu intercâmbio inesquecível.', rating: 5, status: 'approved' },
    { id: 'test-02', name: 'Lucas Mendes', destination: 'K-Beauty', text: 'Roteiro de beleza coreana superou expectativas.', rating: 5, status: 'approved' },
    { id: 'test-03', name: 'Carla Oliveira', destination: 'Jornada Essência da Coreia', text: 'Experiência transformadora.', rating: 4, status: 'pending' }
  ],
  faq_items: [
    { id: 'faq-01', question: 'Quanto tempo antes devo reservar?', answer: 'Recomendamos 3 meses de antecedência.', category: 'Geral', order: 1 },
    { id: 'faq-02', question: 'Oferecem suporte durante a viagem?', answer: 'Sim! Suporte 24/7 via WhatsApp.', category: 'Geral', order: 2 },
    { id: 'faq-03', question: 'Quais documentos para Coreia do Sul?', answer: 'Passaporte válido e visto K-ETA.', category: 'Coreia do Sul', order: 3 },
    { id: 'faq-04', question: 'Intercâmbio inclui acomodação?', answer: 'Sim, todos incluem acomodação e seguro.', category: 'Intercâmbio', order: 4 },
    { id: 'faq-05', question: 'Formas de pagamento?', answer: 'PIX, transferência e cartões em até 12x.', category: 'Pagamentos', order: 5 }
  ],
  navigation_items: [
    { id: 'nav-01', parent_id: null, navigation_type: 'main', label: 'Início', url: '/', icon: null, sort_order: 0, is_active: true },
    { id: 'nav-02', parent_id: null, navigation_type: 'main', label: 'Coreia do Sul', url: '/coreia-do-sul', icon: null, sort_order: 1, is_active: true },
    { id: 'nav-03', parent_id: null, navigation_type: 'main', label: 'Destinos', url: '/destinos', icon: null, sort_order: 2, is_active: true },
    { id: 'nav-04', parent_id: null, navigation_type: 'main', label: 'Experiências', url: '/coreia-do-sul/experiencias', icon: null, sort_order: 3, is_active: true },
    { id: 'nav-05', parent_id: null, navigation_type: 'main', label: 'Jornadas', url: '/coreia-do-sul/jornadas', icon: null, sort_order: 4, is_active: true },
    { id: 'nav-06', parent_id: null, navigation_type: 'main', label: 'Intercâmbio', url: '/coreia-do-sul/intercambio', icon: null, sort_order: 5, is_active: true },
    { id: 'nav-07', parent_id: null, navigation_type: 'main', label: 'Journal', url: '/journal', icon: null, sort_order: 6, is_active: true },
    { id: 'nav-08', parent_id: null, navigation_type: 'main', label: 'Contato', url: '/contato', icon: null, sort_order: 7, is_active: true },
    { id: 'nav-09', parent_id: null, navigation_type: 'footer', label: 'Sobre Nós', url: '/sobre', icon: null, sort_order: 0, is_active: true },
    { id: 'nav-10', parent_id: null, navigation_type: 'footer', label: 'Coreia do Sul', url: '/coreia-do-sul', icon: null, sort_order: 1, is_active: true },
    { id: 'nav-11', parent_id: null, navigation_type: 'footer', label: 'Experiências', url: '/coreia-do-sul/experiencias', icon: null, sort_order: 2, is_active: true },
    { id: 'nav-12', parent_id: null, navigation_type: 'footer', label: 'Jornadas', url: '/coreia-do-sul/jornadas', icon: null, sort_order: 3, is_active: true },
    { id: 'nav-13', parent_id: null, navigation_type: 'footer', label: 'Contato', url: '/contato', icon: null, sort_order: 4, is_active: true }
  ],
  cms_pages: [
    { id: 'page-01', title: 'Sobre Nós', slug: 'sobre', content: '<h2>Sobre a Maeum Global</h2><p>Texto institucional.</p>', status: 'published', updated_at: '2026-07-15' },
    { id: 'page-02', title: 'Política de Privacidade', slug: 'privacidade', content: '<h2>Política de Privacidade</h2>', status: 'published', updated_at: '2026-07-10' },
    { id: 'page-03', title: 'Termos de Uso', slug: 'termos', content: '<h2>Termos de Uso</h2>', status: 'published', updated_at: '2026-07-10' }
  ],
  site_config: {
    brand: { name: 'Maeum Global', tagline: 'Viagens de Luxo, Intercâmbios e Experiências Exclusivas na Ásia', logo_url: '/logo.svg', favicon_url: '/favicon.ico', footer_logo_url: '/logo-branco.svg' },
    contact: { email: 'contato@maeumglobal.com', sales_email: 'vendas@maeumglobal.com', phone: '+55 (11) 99999-8888', whatsapp: '+5511999998888', address: 'Av. Faria Lima, 1000 - São Paulo, SP' },
    social: { instagram: 'https://instagram.com/maeumglobal', facebook: 'https://facebook.com/maeumglobal', youtube: 'https://youtube.com/@maeumglobal', linkedin: 'https://linkedin.com/company/maeumglobal', tiktok: 'https://tiktok.com/@maeumglobal' },
    seo: { title_suffix: '| Maeum Global Travel', meta_description: 'Descubra roteiros de luxo exclusivos, intercâmbios e experiências na Ásia.', google_analytics: '', google_tag_manager: '', meta_pixel: '' },
    smtp: { host: 'smtp.sendgrid.net', port: 587, user: 'no-reply@maeumglobal.com', password: '', admin_email: 'admin@maeumglobal.com' },
    integrations: { stripe_pk: 'pk_live_51M3c...', stripe_sk: '', sendgrid_key: '', recaptcha_key: '', mapbox_token: '' },
    legal: { cnpj: '00.000.000/0001-00', company_name: 'Maeum Global Travel Ltda.', privacy_url: '/privacidade', terms_url: '/termos' }
  }
};

function loadFromStorage(): DbState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {}
  return DEFAULT_STATE;
}

function saveToStorage(state: DbState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

let memoryDb: DbState = loadFromStorage();

export const db = {
  get: <K extends keyof DbState>(table: K): DbState[K] => {
    return memoryDb[table];
  },
  save: <K extends keyof DbState>(table: K, records: DbState[K]): void => {
    memoryDb[table] = records;
    saveToStorage(memoryDb);
  },
  reset: (): void => {
    memoryDb = DEFAULT_STATE;
    saveToStorage(memoryDb);
  }
};
