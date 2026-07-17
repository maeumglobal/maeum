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
    {
      id: 'exp-01', slug: 'seul-depois-do-por-do-sol', title: 'Seul Depois do Pôr do Sol',
      subtitle: 'Uma noite pela energia de Seul: mercados, gastronomia de rua e vida noturna autêntica.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['gastronomia', 'seul-e-vida-urbana'],
      description: 'Explore Seul quando a cidade se transforma. O Pôr do Sol revela uma nova energia: mercados noturnos iluminados, barracas de rua com aromas irresistíveis e ruas pulsando com música e conversas. Esta experiência guia você pelos sabores e sons autênticos da capital coreana depois do anoitecer, conectando gastronomia, cultura urbana e momentos únicos que só quem vive Seul à noite conhece.',
      highlights: [
        'Caminhada noturna por mercados tradicionais',
        'Degustação de comida de rua coreana autêntica',
        'Roteiro por pontos icônicos de Seul à noite',
        'Acompanhamento de guia local especializado'
      ],
      included: ['Experiência guiada', 'Roteiro noturno por Seul', 'Visita ao mercado previsto na programação', 'Experiência gastronômica conforme o roteiro', 'Deslocamento ou veículo conforme a operação da experiência', 'Acompanhamento durante a atividade'],
      duration_hours: 4, price_per_person: 690,
      main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-02', slug: 'palacio-historia-e-hanbok', title: 'Palácio, História e Hanbok',
      subtitle: 'Conheça a história coreana através dos palácios e da tradição do hanbok.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['historia-e-cultura'],
      description: 'Uma experiência para mergulhar na história coreana através da visita aos palácios centenários e da descoberta do hanbok, o vestuário tradicional coreano. Acompanhado por um guia especializado, você percorrerá os mesmos caminhos que reis e rainhas percorreram, enquanto aprende sobre a simbologia e a beleza do hanbok.',
      highlights: [
        'Visita guiada aos palácios históricos',
        'Contextualização histórica detalhada',
        'Passeio pelos pontos definidos na programação',
        'Contato com a tradição do hanbok'
      ],
      included: ['Experiência guiada', 'Visita ao palácio previsto no roteiro', 'Contextualização histórica', 'Passeio pelos pontos definidos na programação', 'Acompanhamento durante a atividade'],
      duration_hours: 4, price_per_person: 490,
      main_image: 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800', 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=800', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'request', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-03', slug: 'uma-noite-as-margens-do-han', title: 'Uma Noite às Margens do Han',
      subtitle: 'Piquenique, convivência e um cruzeiro sob as luzes de Seul.',
      location: 'Rio Han, Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['seul-e-vida-urbana'],
      description: 'Viva uma noite inesquecível às margens do Rio Han. A experiência começa com um piquenique à beira do rio, seguido por momentos de convivência e um cruzeiro noturno que revela Seul sob uma perspectiva mágica, com suas pontes iluminadas refletindo nas águas.',
      highlights: [
        'Experiência no Rio Han',
        'Piquenique conforme a programação',
        'Atividades de convivência',
        'Cruzeiro noturno'
      ],
      included: ['Experiência no Rio Han', 'Piquenique conforme a programação', 'Atividades de convivência', 'Cruzeiro noturno conforme o roteiro', 'Acompanhamento durante a atividade'],
      duration_hours: 4, price_per_person: 850,
      main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', 'https://images.unsplash.com/photo-1578321272176-b7bbc0679e38?q=80&w=800', 'https://images.unsplash.com/photo-1626094309830-abbb0c99da4a?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-04', slug: 'entre-duas-coreias-dmz', title: 'Entre Duas Coreias — DMZ',
      subtitle: 'Uma experiência histórica pela região desmilitarizada que divide a Península Coreana.',
      location: 'Cheorwon', region: 'Cheorwon', city: 'Cheorwon',
      category_slugs: ['historia-e-cultura'],
      description: 'Uma jornada histórica pela região da DMZ para compreender as marcas profundas da divisão da Península Coreana. Em grupo pequeno, você visitará locais históricos, aprenderá sobre a Guerra da Coreia e sentirá o peso e a esperança que coexistem nesta fronteira.',
      highlights: [
        'Tour em grupo pequeno e exclusivo',
        'Roteiro pela região de Cheorwon DMZ',
        'Visitas históricas previstas',
        'Contextualização sobre a Guerra da Coreia'
      ],
      included: ['Tour em grupo pequeno', 'Roteiro pela região de Cheorwon DMZ', 'Visitas históricas previstas na programação', 'Contextualização sobre a Guerra da Coreia e a divisão da Península Coreana', 'Almoço conforme a operação da experiência', 'Acompanhamento durante o roteiro'],
      duration_hours: 9, price_per_person: 1050,
      main_image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800', 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'request', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-05', slug: 'seul-privada-dia-inteiro-i', title: 'Seul Privada — Dia Inteiro I',
      subtitle: 'Um dia inteiro para conhecer diferentes perspectivas de Seul com conforto e exclusividade.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['seul-e-vida-urbana'],
      description: 'Uma experiência privada de dia inteiro para explorar Seul sob diferentes ângulos. Com veículo privativo e guia exclusivo, você descobrirá desde os palácios históricos até os bairros mais contemporâneos, em um ritmo personalizado e com todo o conforto.',
      highlights: [
        'Tour privado e exclusivo',
        'Roteiro personalizado',
        'Veículo privativo',
        'Acompanhamento especializado'
      ],
      included: ['Tour privado', 'Roteiro por pontos selecionados de Seul', 'Veículo privativo conforme a operação', 'Embarque conforme o ponto definido', 'Deslocamentos previstos no roteiro', 'Retorno conforme a operação da experiência', 'Acompanhamento'],
      duration_hours: 9, price_per_person: 1390,
      main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'request', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-06', slug: 'seul-privada-dia-inteiro-ii', title: 'Seul Privada — Dia Inteiro II',
      subtitle: 'Uma segunda proposta de imersão privada em Seul, conectando diferentes pontos da cidade.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['seul-e-vida-urbana'],
      description: 'Uma segunda proposta de imersão privada em Seul, com roteiro diferente do primeiro dia inteiro. Conectando bairros, culturas e sabores, esta experiência oferece uma perspectiva única e complementar da capital coreana.',
      highlights: [
        'Tour privado exclusivo',
        'Roteiro complementar',
        'Veículo privativo',
        'Imersão completa'
      ],
      included: ['Tour privado', 'Roteiro conforme a programação selecionada', 'Veículo privativo conforme a operação', 'Embarque e retorno conforme a experiência', 'Deslocamentos do roteiro', 'Acompanhamento'],
      duration_hours: 9, price_per_person: 1100,
      main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'request', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-07', slug: 'a-historia-servida-em-uma-tigela-makgeolli', title: 'A História Servida em uma Tigela — Experiência Makgeolli',
      subtitle: 'Uma experiência dedicada ao makgeolli, conectando história, tradição artesanal e degustação.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['gastronomia', 'tradicao-coreana'],
      description: 'Descubra o makgeolli, a bebida tradicional coreana que carrega séculos de história em cada gole. Nesta experiência, você será imerso na cultura artesanal do makgeolli, desde suas origens até as técnicas modernas de produção, com degustação guiada por especialistas.',
      highlights: [
        'Experiência de makgeolli artesanal',
        'Apresentação da cultura relacionada à bebida',
        'Contextualização histórica',
        'Degustação guiada'
      ],
      included: ['Experiência de makgeolli artesanal', 'Apresentação da cultura relacionada à bebida', 'Contextualização sobre o makgeolli', 'Degustação e contato com a tradição artesanal conforme a programação do local'],
      duration_hours: 2, price_per_person: 630,
      main_image: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=800', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-08', slug: 'a-memoria-de-um-aroma-perfume-em-um-hanok', title: 'A Memória de um Aroma — Perfume em um Hanok',
      subtitle: 'Crie sua própria fragrância em um ambiente hanok e transforme aromas em memória pessoal da Coreia.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['experiencias-sensoriais'],
      description: 'Realizada em um autêntico hanok (casa tradicional coreana), esta experiência convida você a criar sua própria fragrância pessoal. Guiado por um perfumista, você explorará diferentes notas olfativas e comporá um aroma único que se tornará sua memória olfativa pessoal da Coreia.',
      highlights: [
        'Experiência em ambiente hanok',
        'Introdução à criação de fragrâncias',
        'Contato com diferentes aromas',
        'Criação de fragrância pessoal'
      ],
      included: ['Experiência em ambiente hanok', 'Introdução ao processo de criação de fragrâncias', 'Contato com diferentes aromas e notas olfativas', 'Orientação durante a composição', 'Criação de uma fragrância pessoal conforme o formato da experiência'],
      duration_hours: 1.5, price_per_person: 420,
      main_image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1563170351-be82bc888aa4?q=80&w=800', 'https://images.unsplash.com/photo-1615638852142-22d3e25d6198?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-09', slug: 'o-tempo-de-cuidar-cha-coreano-e-spa-para-os-pes', title: 'O Tempo de Cuidar — Chá Coreano e Spa para os Pés',
      subtitle: 'Uma pausa de bem-estar que combina chá de ervas coreano e spa para os pés.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['bem-estar'],
      description: 'Uma experiência de pausa e cuidado em meio à energia de Seul. Comece com uma cerimônia de chá de ervas coreano, aprendendo sobre as propriedades de cada erva, seguido por um spa para os pés revigorante. O momento perfeito para recarregar as energias.',
      highlights: [
        'Experiência de chá de ervas coreano',
        'Contato com a cultura das ervas',
        'Degustação de chás tradicionais',
        'Spa para os pés'
      ],
      included: ['Experiência de chá de ervas coreano', 'Contato com a cultura relacionada às ervas utilizadas', 'Degustação de chá', 'Spa para os pés', 'Momento de descanso conforme a programação do local'],
      duration_hours: 2.5, price_per_person: 460,
      main_image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800', 'https://images.unsplash.com/photo-1563911892437-1feda0179e1b?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-10', slug: 'o-hanbok-que-conta-quem-voce-e', title: 'O Hanbok que Conta Quem Você É',
      subtitle: 'Descubra o hanbok que expressa sua personalidade com orientação de uma designer especializada.',
      location: 'Insadong, Seul', region: 'Seul', city: 'Seul',
      category_slugs: ['hanbok-e-design'],
      description: 'Mais do que vestir um hanbok, esta experiência é sobre descobrir qual hanbok conta a sua história. Com orientação de uma designer especializada, você aprenderá sobre os elementos do vestuário tradicional coreano e encontrará o estilo que melhor expressa quem você é.',
      highlights: [
        'Orientação especializada com designer',
        'Introdução aos elementos do hanbok',
        'Descoberta de estilo pessoal',
        'Contato com design coreano'
      ],
      included: ['Orientação especializada', 'Introdução aos elementos do hanbok', 'Contato com aspectos de design e composição do vestuário tradicional coreano', 'Experiência de descoberta do estilo pessoal de hanbok'],
      duration_hours: 2, price_per_person: 460,
      main_image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=800', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'direct', available_from: '2026-08-25',
      created_at: new Date().toISOString()
    }
  ],
  kbeauty_partners: [
    {
      id: 'kb-partner-01', name: 'Cheotnun Parceria K-Beauty',
      description: 'Parceira K-Beauty da Cheotnun para experiências de beleza inclusas nas jornadas em grupo.',
      active: true, created_at: new Date().toISOString()
    }
  ],
  kbeauty_experiences: [
    {
      id: 'kb-exp-01', slug: 'sua-pele-o-cuidado-coreano', title: 'Sua Pele, o Cuidado Coreano',
      subtitle: 'Cuidados com a pele e maquiagem K-Beauty conduzidos por profissional especializada.',
      location: 'Seul', region: 'Seul', city: 'Seul',
      partner_id: null,
      description: 'Uma experiência imersiva de cuidados com a pele e maquiagem K-Beauty, conduzida por uma profissional especializada. Aprenda as técnicas e práticas que fazem da beleza coreana uma referência mundial, desde a preparação da pele até a maquiagem final.',
      highlights: [
        'Orientação profissional especializada',
        'Cuidados com a pele',
        'Técnicas de beleza coreana',
        'Experiência de maquiagem K-Beauty'
      ],
      included: ['Orientação profissional', 'Cuidados com a pele conforme a metodologia da profissional', 'Preparação da pele', 'Contato com técnicas de beleza coreana', 'Experiência de maquiagem K-Beauty', 'Orientação durante a atividade'],
      duration_hours: 2, price_per_person: 1050,
      main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800'],
      video_url: '', video_embed: '',
      status: 'active', booking_type: 'request', available_from: '2026-08-25',
      is_partner_experience: false, is_included_in_journey: false,
      created_at: new Date().toISOString()
    }
  ],
  exchange_institutions: [
    { id: 'inst-01', name: 'Lexis Korea', slug: 'lexis-korea', description: 'Escola de idiomas premium na Coreia do Sul, com campi em Gangnam, Hongdae e Busan. Reconhecida pela excelência no ensino de coreano para estrangeiros.', country: 'Coreia do Sul', website: 'https://lexiskorea.com', logo_url: '', active: true, created_at: new Date().toISOString() }
  ],
  exchange_campuses: [
    { id: 'camp-01', institution_id: 'inst-01', name: 'Gangnam', city: 'Seul', location: 'Gangnam-gu, Seul', description: 'Campus principal localizado no coração de Gangnam, o distrito mais sofisticado de Seul. Estrutura moderna com salas de aula equipadas, área de estudo e lounge para estudantes.', main_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800', active: true },
    { id: 'camp-02', institution_id: 'inst-01', name: 'Hongdae', city: 'Seul', location: 'Mapo-gu, Seul', description: 'Campus no vibrante bairro de Hongdae, conhecido pela cultura jovem, arte de rua e vida noturna. Ambiente criativo e dinâmico perfeito para estudantes.', main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800', active: true },
    { id: 'camp-03', institution_id: 'inst-01', name: 'Busan', city: 'Busan', location: 'Haeundae-gu, Busan', description: 'Campus à beira-mar em Busan, na região de Haeundae. Estude coreano com vista para o oceano e aproveite o estilo de vida mais relaxed da segunda maior cidade da Coreia.', main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', active: true }
  ],
  exchange_programs: [
    {
      id: 'prog-01', institution_id: 'inst-01', campus_id: 'camp-01', name: 'Intensive Korean', slug: 'intensive-korean',
      description: 'Programa intensivo de coreano com aulas diárias, ideal para quem deseja aprender o idioma de forma rápida e imersiva.',
      duration_weeks_min: 1, duration_weeks_max: 52, classes_per_week: 20, level_required: 'Todos os níveis',
      pricing_tiers: [
        { range: '1-9', min: 1, max: 9, price_per_week: 375000, currency: 'KRW' },
        { range: '10-19', min: 10, max: 19, price_per_week: 365000, currency: 'KRW' },
        { range: '20-29', min: 20, max: 29, price_per_week: 355000, currency: 'KRW' },
        { range: '30+', min: 30, max: 999, price_per_week: 345000, currency: 'KRW' }
      ],
      includes_enrollment_fee: true, enrollment_fee: 100000, enrollment_fee_currency: 'KRW',
      includes_material: true, material_fee: 50000, material_fee_currency: 'KRW',
      cultural_activities: true, active: true
    },
    {
      id: 'prog-02', institution_id: 'inst-01', campus_id: 'camp-02', name: 'Standard Korean', slug: 'standard-korean',
      description: 'Programa regular de coreano com aulas equilibradas entre aprendizado do idioma e tempo livre para explorar a Coreia.',
      duration_weeks_min: 1, duration_weeks_max: 52, classes_per_week: 15, level_required: 'Todos os níveis',
      pricing_tiers: [
        { range: '1-9', min: 1, max: 9, price_per_week: 295000, currency: 'KRW' },
        { range: '10-19', min: 10, max: 19, price_per_week: 285000, currency: 'KRW' },
        { range: '20-29', min: 20, max: 29, price_per_week: 275000, currency: 'KRW' },
        { range: '30+', min: 30, max: 999, price_per_week: 265000, currency: 'KRW' }
      ],
      includes_enrollment_fee: true, enrollment_fee: 100000, enrollment_fee_currency: 'KRW',
      includes_material: false, material_fee: 0, material_fee_currency: 'KRW',
      cultural_activities: true, active: true
    }
  ],
  journeys: [
    {
      id: 'jour-01', slug: 'cheotnun-a-magia-da-primeira-neve-na-coreia', title: 'Cheotnun — A Magia da Primeira Neve na Coreia',
      subtitle: 'Viva a magia da primeira neve na Coreia com acompanhamento exclusivo Maeum Global.',
      concept: 'A primeira neve na Coreia é mais que um fenômeno meteorológico — é um momento de renovação, beleza e significado cultural. Cheotnun (primeira neve) convida você a viver o inverno coreano em sua plenitude, compartilhando momentos únicos com novas amigas em uma jornada cuidadosamente desenhada.',
      destinations: ['Seul'],
      duration_days: 10,
      total_spots: 12,
      accommodation: 'Hotel 4 estrelas',
      price_per_person: 32000,
      price_currency: 'BRL',
      main_image: 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800', 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=800'],
      video_url: '', video_embed: '',
      included: [
        'Passagem aérea internacional de ida e volta',
        'Seguro viagem',
        'Hospedagem em hotel 4 estrelas',
        'Logística e transportes previstos no roteiro do grupo',
        'Transfers previstos na programação',
        'Acompanhamento durante a jornada',
        'Suporte em português',
        'Ingressos das experiências definidas no roteiro',
        'Palácio Gyeongbokgung',
        'Experiência relacionada ao hanbok conforme o roteiro',
        'Bukchon Hanok Village',
        'Insadong',
        'Myeongdong',
        'Experiências culturais previstas na programação',
        'A Magia de Herb Island',
        'Experiência K-Beauty parceira da Cheotnun',
        'Experiência de inverno no Jisan Ski Resort'
      ],
      not_included: ['Despesas pessoais', 'Alimentação não especificada', 'Seguro viagem adicional'],
      itinerary: [
        { day: 1, title: 'Chegada a Seul', description: 'Recepção no aeroporto de Incheon e traslado para o hotel. Recepção de boas-vindas do grupo.' },
        { day: 2, title: 'Palácio Gyeongbokgung e Hanbok', description: 'Visita ao Palácio Gyeongbokgung com experiência de hanbok. Passeio por Bukchon Hanok Village e Insadong.' },
        { day: 3, title: 'Myeongdong e K-Beauty', description: 'Experiência K-Beauty parceira Cheotnun. Tarde livre em Myeongdong para compras.' },
        { day: 4, title: 'A Magia de Herb Island', description: 'Excursão para Herb Island, um dos destinos de inverno mais encantadores da Coreia.' },
        { day: 5, title: 'Jisan Ski Resort', description: 'Dia de neve no Jisan Ski Resort com experiências de inverno.' },
        { day: 6, title: 'Cultura e Tradição', description: 'Atividades culturais e visitas a pontos históricos.' },
        { day: 7, title: 'Exploração Livre', description: 'Dia livre para explorar Seul ou participar de atividades opcionais.' },
        { day: 8, title: 'Experiências Gastronômicas', description: 'Tour gastronômico por mercados e restaurantes selecionados.' },
        { day: 9, title: 'Encerramento', description: 'Jantar de despedida e celebração da jornada.' },
        { day: 10, title: 'Retorno', description: 'Traslado para o aeroporto e voo de retorno.' }
      ],
      highlights: [
        { title: 'A Magia de Herb Island', description: 'Um dos destinos de inverno mais encantadores da Coreia, com paisagens cobertas de neve.', image: 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800' },
        { title: 'Experiência K-Beauty Cheotnun', description: 'Experiência K-Beauty parceira inclusa no investimento da viagem.', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800' },
        { title: 'Jisan Ski Resort', description: 'Experiência de inverno completa com neve e atividades ao ar livre.', image: 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=800' }
      ],
      payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 },
      status: 'active',
      category: 'premium',
      created_at: new Date().toISOString()
    },
    {
      id: 'jour-02', slug: 'caravana-de-verao-2027-seul-e-busan', title: 'Caravana de Verão 2027 — Seul e Busan',
      subtitle: '10 dias explorando o melhor de Seul e Busan no verão coreano.',
      concept: 'O verão coreano é vibrante, cheio de festivais, praias e energia contagiante. A Caravana de Verão Maeum leva você a descobrir Seul e Busan em sua estação mais animada, com duas categorias de experiência: Liberty e Prestige.',
      destinations: ['Seul', 'Busan'],
      duration_days: 10,
      total_spots: 20,
      accommodation: 'Hotel 4 estrelas',
      price_per_person: 29000,
      price_currency: 'BRL',
      main_image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800'],
      video_url: '', video_embed: '',
      categories: [
        { name: 'Liberty', price: 29000, description: 'Experiência completa com hospedagem confortável e todas as experiências principais.', included: ['Hospedagem 4 estrelas', 'Transfers previstos', 'Acompanhamento do grupo', 'Experiências selecionadas em Seul', 'Experiências em Busan'] },
        { name: 'Prestige', price: 34000, description: 'Experiência premium com hospedagem superior, benefícios exclusivos e experiências adicionais.', included: ['Hospedagem 5 estrelas', 'Transfers VIP', 'Acompanhamento do grupo', 'Experiências selecionadas em Seul', 'Experiências em Busan', 'Sky Capsule Busan', 'Spa Land', 'The Bay 101'] }
      ],
      included: [
        'Hospedagem conforme categoria selecionada',
        'Transfers previstos na programação',
        'Acompanhamento do grupo',
        'Experiências em Seul',
        'Experiências em Busan',
        'Suporte antes e durante a jornada'
      ],
      not_included: ['Passagens aéreas', 'Seguro viagem', 'Alimentação não especificada'],
      itinerary: [
        { day: 1, title: 'Chegada a Seul', description: 'Recepção e traslado ao hotel.' },
        { day: 2, title: 'Hongdae e Rio Han', description: 'Exploração de Hongdae e cruzeiro no Rio Han.' },
        { day: 3, title: 'Gyeongbokgung e Cultura', description: 'Visita ao Palácio Gyeongbokgung.' },
        { day: 4, title: 'Experiências em Seul', description: 'Atividades culturais e gastronômicas.' },
        { day: 5, title: 'Viagem a Busan', description: 'Deslocamento para Busan de KTX.' },
        { day: 6, title: 'Haeundae e Gwangalli', description: 'Praias e paisagens costeiras.' },
        { day: 7, title: 'Sky Capsule e Songdo', description: 'Sky Capsule e Songdo Cable Car.' },
        { day: 8, title: 'Gamcheon e Haedong', description: 'Gamcheon Culture Village e Haedong Yonggungsa.' },
        { day: 9, title: 'Oryukdo e The Bay 101', description: 'Oryukdo Skywalk e The Bay 101.' },
        { day: 10, title: 'Retorno', description: 'Traslado ao aeroporto e voo de retorno.' }
      ],
      highlights: [
        { title: 'Sky Capsule Busan', description: 'Experiência icônica do Sky Capsule em Busan.', image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800' },
        { title: 'K-BBQ Experience', description: 'Experiência gastronômica de churrasco coreano.', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800' }
      ],
      payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 },
      status: 'active',
      category: 'premium',
      created_at: new Date().toISOString()
    },
    {
      id: 'jour-03', slug: 'projeto-army-2027-always-destination', title: 'Projeto ARMY 2027 — Always Destination',
      subtitle: '15 dias por Seul, Busan e Daegu em uma experiência ARMY única.',
      concept: 'Muito mais que um roteiro, o Projeto ARMY é uma curadoria de experiências desenhada para quem busca transcender o turismo convencional, onde estranhas se tornam família e sonhos se transformam em vivências reais.',
      destinations: ['Seul', 'Busan', 'Daegu'],
      duration_days: 15,
      total_spots: 15,
      accommodation: 'Casa ARMY (hospedagem conceito)',
      price_per_person: 39000,
      price_currency: 'BRL',
      main_image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800'],
      video_url: '', video_embed: '',
      included: [
        'Passagem aérea internacional de ida e volta saindo de São Paulo',
        'Hospedagem conceito Casa ARMY',
        'Bilhetes de trem KTX previstos no roteiro',
        'Experiências do roteiro',
        'Experiências previstas em Seul e Incheon',
        'Acompanhamento do grupo',
        'Crédito ou voucher de USD 350 para alimentação conforme as condições do pacote'
      ],
      not_included: ['Seguro viagem adicional', 'Despesas pessoais', 'Alimentação excedente ao voucher'],
      highlights: [
        { title: 'Pulseira em Gangnam', description: 'Experiência exclusiva em Gangnam.', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800' },
        { title: 'Aula de K-Pop', description: 'Aula profissional de K-Pop em estúdio.', image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800' },
        { title: 'Gravação em Estúdio', description: 'Experiência de gravação em estúdio profissional.', image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?q=80&w=800' }
      ],
      itinerary: [
        { day: 1, title: 'Chegada a Seul', description: 'Recepção e check-in na Casa ARMY.' },
        { day: 2, title: 'Pulseira em Gangnam', description: 'Experiência exclusiva em Gangnam.' },
        { day: 3, title: 'Aula de K-Pop', description: 'Aula profissional em estúdio.' },
        { day: 4, title: 'Gravação em Estúdio', description: 'Gravação profissional.' },
        { day: 5, title: 'Oficina de Pintura', description: 'Oficina criativa.' },
        { day: 6, title: 'Troca de Cartas ARMY', description: 'Momento de conexão ARMY.' },
        { day: 7, title: 'Casa ARMY', description: 'Dia especial na Casa ARMY.' },
        { day: 8, title: 'Jantar Temático', description: 'Jantar especial ARMY.' },
        { day: 9, title: 'Cruzeiro Rio Han', description: 'Cruzeiro noturno pelo Rio Han.' },
        { day: 10, title: 'Busan', description: 'Viagem a Busan de KTX.' },
        { day: 11, title: 'Experiências em Busan', description: 'Exploração de Busan.' },
        { day: 12, title: 'Daegu', description: 'Viagem e experiências em Daegu.' },
        { day: 13, title: 'Retorno a Seul', description: 'Retorno a Seul.' },
        { day: 14, title: 'Encerramento', description: 'Jantar de despedida.' },
        { day: 15, title: 'Retorno', description: 'Voo de retorno ao Brasil.' }
      ],
      payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 },
      status: 'active',
      category: 'army',
      created_at: new Date().toISOString()
    },
    {
      id: 'jour-04', slug: 'projeto-army-2027-the-horizon-of-seven-jeju', title: 'Projeto ARMY 2027 — The Horizon of Seven — Jeju Edition',
      subtitle: '15 dias por Seul, Busan e Ilha de Jeju em uma experiência ARMY completa.',
      concept: 'Muito mais que um roteiro, o Projeto ARMY é uma curadoria de experiências desenhada para quem busca transcender o turismo convencional, onde estranhas se tornam família e sonhos se transformam em vivências reais.',
      destinations: ['Seul', 'Busan', 'Ilha de Jeju'],
      duration_days: 15,
      total_spots: 15,
      accommodation: 'Casa ARMY + Hospedagem em Jeju',
      price_per_person: 42000,
      price_currency: 'BRL',
      main_image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800',
      gallery: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800'],
      video_url: '', video_embed: '',
      included: [
        'Passagem aérea internacional de ida e volta saindo de São Paulo',
        'Hospedagem conceito Casa ARMY',
        'Voos internos de ida e volta para Jeju',
        'Hospedagem em Jeju',
        'Experiências previstas na ilha',
        'Cavalgada',
        'Experiência de fogueira sob as estrelas',
        'Tours cênicos',
        'Momentos de contemplação previstos no roteiro',
        'Transporte local na ilha conforme a programação',
        'Acompanhamento do grupo'
      ],
      not_included: ['Seguro viagem adicional', 'Despesas pessoais', 'Alimentação não especificada'],
      highlights: [
        { title: 'Cavalgada em Jeju', description: 'Experiência única de cavalgada na Ilha de Jeju.', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800' },
        { title: 'Fogueira sob as Estrelas', description: 'Noite de fogueira e contemplação em Jeju.', image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800' }
      ],
      itinerary: [
        { day: 1, title: 'Chegada a Seul', description: 'Recepção e check-in na Casa ARMY.' },
        { day: 2, title: 'Seul', description: 'Exploração de Seul.' },
        { day: 3, title: 'Experiências ARMY', description: 'Atividades especiais ARMY.' },
        { day: 4, title: 'Busan', description: 'Viagem a Busan de KTX.' },
        { day: 5, title: 'Busan', description: 'Exploração de Busan.' },
        { day: 6, title: 'Jeju', description: 'Voo para Jeju e check-in.' },
        { day: 7, title: 'Cavalgada', description: 'Experiência de cavalgada em Jeju.' },
        { day: 8, title: 'Fogueira sob as Estrelas', description: 'Noite especial de fogueira.' },
        { day: 9, title: 'Tours Cênicos', description: 'Exploração das paisagens de Jeju.' },
        { day: 10, title: 'Contemplação', description: 'Momentos de contemplação.' },
        { day: 11, title: 'Retorno a Seul', description: 'Voo de volta a Seul.' },
        { day: 12, title: 'Seul', description: 'Atividades em Seul.' },
        { day: 13, title: 'Encerramento', description: 'Jantar de despedida.' },
        { day: 14, title: 'Retorno', description: 'Voo de retorno ao Brasil.' }
      ],
      payment_options: { pix: true, boleto_parcelas: 48, credit_card_parcelas: 24, credit_card_juros_parcelas: '25-48', credit_card_juros_taxa: 0.05 },
      status: 'active',
      category: 'army',
      created_at: new Date().toISOString()
    }
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
