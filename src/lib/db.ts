// Local In-Memory Database Engine for Maeum Global (Completely client-safe)
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
}

const DEFAULT_STATE: DbState = {
  users: [
    { id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', email: 'admin@maeum.com', name: 'Super Administrador Maeum', role: 'super_admin', phone: '+5541999999999' },
    { id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'consultora1@maeum.com', name: 'Mariana Santos', role: 'consultora', phone: '+5541988888888', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200' },
    { id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', email: 'cliente@maeum.com', name: 'Bruno Almeida', role: 'customer', phone: '+5541977777777', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' }
  ],
  destinations: [
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Coreia do Sul', slug: 'coreia-do-sul', country: 'Coreia', description: 'Um país fascinante que mistura tradição milenar com modernidade futurista.', main_image: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'], map_coordinates: { lat: 37.5665, lng: 126.9780 }, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', is_featured: true, seo_title: 'Viaje para a Coreia do Sul | Maeum Global', seo_description: 'Descubra roteiros de luxo exclusivos para a Coreia do Sul.' },
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'Japão', slug: 'japao', country: 'Japão', description: 'Templos históricos, montanhas majestosas e metrópoles vibrantes.', main_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800'], map_coordinates: { lat: 35.6762, lng: 139.6503 }, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', is_featured: true, seo_title: 'Roteiros de Luxo no Japão | Maeum Global', seo_description: 'Experimente o melhor do Japão tradicional e moderno com a Maeum.' },
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Vietnã', slug: 'vietna', country: 'Vietnã', description: 'Paisagens naturais exuberantes e ricas experiências culinárias.', main_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800', gallery: ['https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800'], map_coordinates: { lat: 21.0285, lng: 105.8542 }, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', is_featured: true, seo_title: 'Descubra o Vietnã | Maeum Global', seo_description: 'Passeios personalizados de alto padrão pelo Vietnã.' }
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
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      itinerary: [
        { day: 1, title: 'Chegada em Seul', description: 'Recepção no aeroporto de Incheon e traslado privativo para o hotel de luxo. Tempo livre para descanso.' },
        { day: 2, title: 'Palácios Tradicionais e Hanbok', description: 'Visita guiada ao Palácio Gyeongbokgung com aluguel de Hanbok de seda. Almoço tradicional em Insadong e passeio por Bukchon Hanok Village.' },
        { day: 3, title: 'Modernidade e Vlogs', description: 'Passeio pelo bairro jovem de Hongdae, visita à N Seoul Tower com vista panorâmica e jantar especial de Korean BBQ.' }
      ],
      included: ['Traslado privativo aeroporto/hotel', 'Hospedagem 5 estrelas em Seul', 'Guia bilíngue em português', 'Ingressos de todas as atrações listadas'],
      not_included: ['Passagens aéreas internacionais', 'Seguro viagem internacional (adicional recomendado)', 'Almoços e jantares livres'],
      status: 'active'
    }
  ],
  crm_leads: [
    {
      id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Bruno Almeida',
      phone: '+5541977777777',
      email: 'cliente@maeum.com',
      interest_destination: 'Coreia do Sul',
      origin: 'Site / Formulário Destinos',
      status: 'proposal',
      assigned_consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      notes: 'Lead muito interessado em fazer intercâmbio e viagem de férias em Seul. Proposta em elaboração.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  proposals: [
    {
      id: 'f1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      lead_id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Viagem de Luxo - Coreia de Bruno',
      status: 'sent',
      total_amount: 4200.00,
      unique_link: 'viagem-bruno-seul-2026',
      version: 1,
      items: [
        { type: 'package', name: 'Essência da Coreia do Sul', price: 3500.00, details: '10 Dias de roteiro completo com guias exclusivos' },
        { type: 'insurance', name: 'Seguro Viagem Global Premium', price: 150.00, details: 'Cobertura médica internacional ampliada' },
        { type: 'ktx_pass', name: 'KTX Rail Pass Coreia - 5 dias', price: 200.00, details: 'Passagens ilimitadas de trem-bala' },
        { type: 'wifi_chip', name: 'Chip eSIM de Dados Ilimitados', price: 50.00, details: 'Conexão 4G/5G ilimitada por toda a viagem' },
        { type: 'extra_tour', name: 'Sessão de Fotos com Fotógrafo em Bukchon', price: 300.00, details: 'Ensaio fotográfico privativo de 2 horas' }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  proposal_versions: [],
  trips: [
    {
      id: 'trip-1',
      client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      package_id: 'c1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Roteiro dos Sonhos: Coreia do Sul 2026',
      start_date: '2026-10-15',
      end_date: '2026-10-25',
      timeline: [
        { date: '2026-10-15', time: '14:00', title: 'Check-in Hotel Four Seasons', description: 'Recepção VIP e acomodação em suíte deluxe.' },
        { date: '2026-10-16', time: '09:00', title: 'Tour Palácios Reais', description: 'Passeio privativo guiado em português, vestindo Hanbok.' },
        { date: '2026-10-17', time: '11:00', title: 'Skincare e Compras K-Beauty', description: 'Visita à clínica estética de luxo e compras guiadas.' }
      ],
      payments: [
        { due_date: '2026-08-15', amount: 2100.00, status: 'paid', invoice_url: '/invoices/inv-001.pdf' },
        { due_date: '2026-09-15', amount: 2100.00, status: 'pending', invoice_url: '/invoices/inv-002.pdf' }
      ],
      status: 'preparation',
      created_at: new Date().toISOString()
    }
  ],
  documents: [
    { id: 'doc-1', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', uploaded_by: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', file_name: 'Passaporte_Bruno.pdf', file_url: '/uploads/docs/passaporte-bruno.pdf', file_size: 1048576, category: 'passport', created_at: new Date().toISOString() }
  ],
  chats: [
    { id: 'chat-1', client_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', consultant_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', created_at: new Date().toISOString() }
  ],
  chat_messages: [
    { id: 'msg-1', chat_id: 'chat-1', sender_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', content: 'Olá Bruno! Criei uma proposta exclusiva para a sua viagem para a Coreia. Dê uma olhada no seu painel de propostas!', attachment_url: null, attachment_type: null, read_at: new Date().toISOString(), created_at: new Date().toISOString() }
  ],
  cms_blocks: [
    {
      id: 'block-hero-maeum',
      page_name: 'home',
      section_id: 'hero',
      block_type: 'hero',
      content: {
        title: 'Descubra a Ásia antes mesmo de embarcar.',
        subtitle: 'Histórias, dicas e experiências reais para transformar sua viagem de luxo.',
        btnText: 'ASSISTIR AO VÍDEO INSTITUCIONAL',
        btnLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        bgImage: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1920'
      },
      sort_order: 0,
      active: true
    }
  ],
  system_settings: {
    visual_theme: {
      colors: {
        primary: '#C8A27C',
        secondary: '#1C1C1C',
        accent: '#B8860B',
        accentHover: '#8B6508',
        text: '#1C1C1C',
        background: '#FAF9F6',
        card: '#FFFFFF'
      },
      typography: {
        titleFont: 'Cormorant Garamond',
        bodyFont: 'Plus Jakarta Sans',
        baseSize: '16px'
      },
      logo_url: '/logo-maeum.png',
      favicon_url: '/favicon-maeum.ico'
    },
    company_details: {
      name: 'Maeum Global Travel S.L.',
      phone: '+55 (41) 98709-4799',
      whatsapp: '+5541987094799',
      email: 'contato@maeumglobal.com',
      address: 'Av. Batel 1230, Curitiba, PR, Brasil',
      social: {
        instagram: 'https://instagram.com/maeumglobal',
        youtube: 'https://youtube.com/maeumglobal'
      }
    }
  }
};

let memoryDb: DbState = DEFAULT_STATE;

export const db = {
  get: <K extends keyof DbState>(table: K): DbState[K] => {
    return memoryDb[table];
  },
  save: <K extends keyof DbState>(table: K, records: DbState[K]): void => {
    memoryDb[table] = records;
  }
};
