import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados Maeum Global...');

  // ─── USUÁRIOS ─────────────────────────────────────────────
  console.log('👤 Criando usuários...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@maeum.com' },
    update: {},
    create: {
      id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'admin@maeum.com',
      name: 'Super Administrador Maeum',
      passwordHash: 'maeum2026', // dev only
      role: 'super_admin',
      phone: '+5541999999999',
    },
  });

  const consultora = await prisma.user.upsert({
    where: { email: 'consultora1@maeum.com' },
    update: {},
    create: {
      id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      email: 'consultora1@maeum.com',
      name: 'Mariana Santos',
      passwordHash: 'maeum2026',
      role: 'consultora',
      phone: '+5541988888888',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@maeum.com' },
    update: {},
    create: {
      id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      email: 'cliente@maeum.com',
      name: 'Bruno Almeida',
      passwordHash: 'maeum2026',
      role: 'customer',
      phone: '+5541977777777',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    },
  });

  console.log('✅ Usuários criados:', adminUser.name, consultora.name, cliente.name);

  // ─── DESTINOS ─────────────────────────────────────────────
  console.log('🗺️ Criando destinos...');
  await prisma.destination.upsert({
    where: { slug: 'coreia-do-sul' },
    update: {},
    create: {
      name: 'Coreia do Sul',
      slug: 'coreia-do-sul',
      country: 'Coreia',
      description: 'Um país fascinante que mistura tradição milenar com modernidade futurista.',
      mainImage: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=800',
      gallery: JSON.stringify(['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800']),
      mapLat: 37.5665,
      mapLng: 126.9780,
      seoTitle: 'Viaje para a Coreia do Sul | Maeum Global',
      seoDescription: 'Descubra roteiros de luxo exclusivos para a Coreia do Sul.',
    },
  });

  // ─── PACOTE ─────────────────────────────────────────────
  console.log('📦 Criando pacotes...');
  const pkg = await prisma.package.upsert({
    where: { slug: 'essencia-da-coreia-do-sul' },
    update: {},
    create: {
      title: 'Essência da Coreia do Sul',
      slug: 'essencia-da-coreia-do-sul',
      destination: 'Coreia do Sul',
      price: 3500.00,
      description: 'Pacote de 10 dias explorando Seul, Busan e Gyeongju com hotéis de alto padrão e guias nativos.',
      gallery: JSON.stringify(['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800']),
      itinerary: JSON.stringify([
        { day: 1, title: 'Chegada em Seul', description: 'Recepção no aeroporto de Incheon e traslado privativo.' },
        { day: 2, title: 'Palácios Tradicionais e Hanbok', description: 'Visita guiada ao Palácio Gyeongbokgung.' },
        { day: 3, title: 'Modernidade e Vlogs', description: 'Passeio por Hongdae, N Seoul Tower e jantar Korean BBQ.' },
      ]),
      included: JSON.stringify(['Traslado privativo', 'Hospedagem 5 estrelas', 'Guia bilíngue', 'Ingressos']),
      notIncluded: JSON.stringify(['Passagens aéreas', 'Seguro viagem', 'Alimentação livre']),
      status: 'active',
    },
  });

  // ─── LEAD ─────────────────────────────────────────────
  console.log('📋 Criando leads...');
  const lead = await prisma.lead.upsert({
    where: { id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11' },
    update: {},
    create: {
      id: 'e1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Bruno Almeida',
      phone: '+5541977777777',
      email: 'cliente@maeum.com',
      destination: 'Coreia do Sul',
      origin: 'Site / Formulário Destinos',
      status: 'proposta',
      consultantId: consultora.id,
      notes: 'Lead muito interessado em intercâmbio e viagem.',
    },
  });

  // ─── PROPOSTA ─────────────────────────────────────────────
  console.log('📄 Criando proposta...');
  const proposta = await prisma.proposal.upsert({
    where: { id: 'f1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11' },
    update: {},
    create: {
      id: 'f1ebc999-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Viagem de Luxo - Coreia de Bruno',
      status: 'sent',
      totalValue: 4200.00,
      uniqueLink: 'viagem-bruno-seul-2026',
      consultantId: consultora.id,
      customerId: cliente.id,
      leadId: lead.id,
      version: 1,
    },
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposta.id, type: 'package', name: 'Essência da Coreia do Sul', price: 3500.00, details: '10 Dias com guias exclusivos' },
      { proposalId: proposta.id, type: 'insurance', name: 'Seguro Viagem Global Premium', price: 150.00, details: 'Cobertura médica internacional' },
      { proposalId: proposta.id, type: 'ktx', name: 'KTX Rail Pass - 5 dias', price: 200.00, details: 'Passagens ilimitadas de trem-bala' },
      { proposalId: proposta.id, type: 'wifi', name: 'Chip eSIM Dados Ilimitados', price: 50.00, details: '4G/5G ilimitada' },
      { proposalId: proposta.id, type: 'extra', name: 'Sessão de Fotos em Bukchon', price: 300.00, details: 'Ensaio fotográfico privativo de 2 horas' },
    ],
  });

  // ─── BOOKING ─────────────────────────────────────────────
  console.log('🏨 Criando booking...');
  const booking = await prisma.booking.upsert({
    where: { id: 'booking-bruno-001' },
    update: {},
    create: {
      id: 'booking-bruno-001',
      clientId: cliente.id,
      packageId: pkg.id,
      proposalId: proposta.id,
      status: 'confirmed',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-25'),
      totalPrice: 4200.00,
      notes: 'Roteiro dos Sonhos: Coreia do Sul 2026',
    },
  });

  await prisma.bookingTimeline.createMany({
    data: [
      { bookingId: booking.id, eventDate: new Date('2026-10-15'), eventTime: '14:00', title: 'Check-in Hotel Four Seasons', description: 'Suíte deluxe.' },
      { bookingId: booking.id, eventDate: new Date('2026-10-16'), eventTime: '09:00', title: 'Tour Palácios Reais', description: 'Passeio privativo guiado em português.' },
      { bookingId: booking.id, eventDate: new Date('2026-10-17'), eventTime: '11:00', title: 'Skincare K-Beauty', description: 'Visita à clínica estética de luxo.' },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { bookingId: booking.id, clientId: cliente.id, amount: 2100.00, status: 'paid', paymentMethod: 'pix', dueDate: new Date('2026-08-15'), paidAt: new Date('2026-08-15') },
      { bookingId: booking.id, clientId: cliente.id, amount: 2100.00, status: 'pending', paymentMethod: 'credit_card', dueDate: new Date('2026-09-15') },
    ],
  });

  // ─── CHAT ─────────────────────────────────────────────
  console.log('💬 Criando chat...');
  const chat = await prisma.chat.upsert({
    where: { id: 'chat-bruno-mariana-001' },
    update: {},
    create: {
      id: 'chat-bruno-mariana-001',
      consultantId: consultora.id,
      customerId: cliente.id,
    },
  });

  await prisma.chatMessage.upsert({
    where: { id: 'msg-001' },
    update: {},
    create: {
      id: 'msg-001',
      chatId: chat.id,
      senderId: consultora.id,
      content: 'Olá Bruno! Criei uma proposta exclusiva para a sua viagem para a Coreia. Dê uma olhada no seu painel!',
    },
  });

  // ─── CATEGORIAS ─────────────────────────────────────────────
  console.log('🏷️ Criando categorias...');
  const categoriesData = [
    { slug: 'historia-e-cultura', name: 'História e Cultura' },
    { slug: 'gastronomia', name: 'Gastronomia' },
    { slug: 'seul-e-vida-urbana', name: 'Seul e Vida Urbana' },
    { slug: 'bem-estar', name: 'Bem-estar' },
    { slug: 'tradicao-coreana', name: 'Tradição Coreana' },
    { slug: 'experiencias-sensoriais', name: 'Experiências Sensoriais' },
    { slug: 'k-beauty', name: 'K-Beauty' },
    { slug: 'hanbok-e-design', name: 'Hanbok e Design' },
  ];

  for (let i = 0; i < categoriesData.length; i++) {
    await prisma.category.upsert({
      where: { slug: categoriesData[i].slug },
      update: {},
      create: { ...categoriesData[i], sortOrder: i, isActive: true },
    });
  }

  // ─── EXPERIÊNCIAS ─────────────────────────────────────────────
  console.log('✨ Criando experiências...');
  const experiencesData = [
    { slug: 'seul-depois-do-por-do-sol', title: 'Seul Depois do Pôr do Sol', subtitle: 'Uma noite pela energia de Seul.', location: 'Seul', description: 'Explore Seul quando a cidade se transforma.', highlights: ['Caminhada noturna por mercados tradicionais', 'Degustação de comida de rua coreana'], included: ['Experiência guiada', 'Acompanhamento'], durationHours: 4, pricePerPerson: 690, mainImage: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800', bookingType: 'direct' },
    { slug: 'palacio-historia-e-hanbok', title: 'Palácio, História e Hanbok', subtitle: 'Conheça a história coreana.', location: 'Seul', description: 'Mergulhe na história coreana visitando palácios centenários.', highlights: ['Visita guiada', 'Contextualização histórica', 'Hanbok'], included: ['Experiência guiada', 'Visita ao palácio'], durationHours: 4, pricePerPerson: 490, mainImage: 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800', bookingType: 'request' },
    { slug: 'uma-noite-as-margens-do-han', title: 'Uma Noite às Margens do Han', subtitle: 'Piquenique e cruzeiro sob as luzes de Seul.', location: 'Rio Han, Seul', description: 'Noite inesquecível às margens do Rio Han.', highlights: ['Piquenique', 'Cruzeiro noturno'], included: ['Piquenique', 'Cruzeiro'], durationHours: 4, pricePerPerson: 850, mainImage: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800', bookingType: 'direct' },
    { slug: 'entre-duas-coreias-dmz', title: 'Entre Duas Coreias — DMZ', subtitle: 'Experiência histórica pela região desmilitarizada.', location: 'Cheorwon', description: 'Jornada pela DMZ.', highlights: ['Tour DMZ', 'Contextualização'], included: ['Tour', 'Visitas históricas'], durationHours: 9, pricePerPerson: 1050, mainImage: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800', bookingType: 'request' },
    { slug: 'a-historia-servida-em-uma-tigela-makgeolli', title: 'A História Servida em uma Tigela — Makgeolli', subtitle: 'História, tradição artesanal e degustação.', location: 'Seul', description: 'Descubra o makgeolli, bebida tradicional coreana.', highlights: ['Makgeolli artesanal', 'Degustação guiada'], included: ['Experiência', 'Degustação'], durationHours: 2, pricePerPerson: 630, mainImage: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=800', bookingType: 'direct' },
  ];

  for (const exp of experiencesData) {
    await prisma.experience.upsert({
      where: { slug: exp.slug },
      update: {},
      create: {
        slug: exp.slug,
        title: exp.title,
        subtitle: exp.subtitle,
        location: exp.location,
        description: exp.description,
        highlights: JSON.stringify(exp.highlights),
        included: JSON.stringify(exp.included),
        durationHours: exp.durationHours,
        pricePerPerson: exp.pricePerPerson,
        mainImage: exp.mainImage,
        gallery: JSON.stringify([]),
        status: 'active',
        bookingType: exp.bookingType,
        availableFrom: new Date('2026-08-25'),
      },
    });
  }

  // ─── JORNADAS ─────────────────────────────────────────────
  console.log('🌸 Criando jornadas...');
  const journeysData = [
    { slug: 'cheotnun-a-magia-da-primeira-neve-na-coreia', title: 'Cheotnun — A Magia da Primeira Neve na Coreia', subtitle: 'Viva a magia da primeira neve na Coreia.', durationDays: 10, pricePerPerson: 32000, category: 'premium', mainImage: 'https://images.unsplash.com/photo-1529973565457-a60a2ccf750d?q=80&w=800' },
    { slug: 'caravana-de-verao-2027-seul-e-busan', title: 'Caravana de Verão 2027 — Seul e Busan', subtitle: '10 dias explorando Seul e Busan no verão.', durationDays: 10, pricePerPerson: 29000, category: 'premium', mainImage: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800' },
    { slug: 'projeto-army-2027-always-destination', title: 'Projeto ARMY 2027 — Always Destination', subtitle: '15 dias em Seul, Busan e Daegu.', durationDays: 15, pricePerPerson: 39000, category: 'army', mainImage: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800' },
    { slug: 'projeto-army-2027-the-horizon-of-seven-jeju', title: 'Projeto ARMY 2027 — The Horizon of Seven — Jeju Edition', subtitle: '15 dias: Seul, Busan e Ilha de Jeju.', durationDays: 15, pricePerPerson: 42000, category: 'army', mainImage: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800' },
  ];

  for (const j of journeysData) {
    await prisma.journey.upsert({
      where: { slug: j.slug },
      update: {},
      create: {
        slug: j.slug,
        title: j.title,
        subtitle: j.subtitle,
        destinations: JSON.stringify(['Seul']),
        durationDays: j.durationDays,
        totalSpots: 15,
        pricePerPerson: j.pricePerPerson,
        priceCurrency: 'BRL',
        mainImage: j.mainImage,
        included: JSON.stringify(['Passagem aérea', 'Hospedagem', 'Transfers', 'Acompanhamento']),
        notIncluded: JSON.stringify(['Despesas pessoais', 'Alimentação não especificada']),
        paymentOptions: JSON.stringify({ pix: true, boleto_parcelas: 48, credit_card_parcelas: 24 }),
        status: 'active',
        category: j.category,
      },
    });
  }

  // ─── BLOG ─────────────────────────────────────────────
  console.log('📝 Criando posts do blog...');
  const blogPosts = [
    { slug: 'como-planejar-viagem-de-luxo-a-seul', title: 'Como Planejar sua Viagem de Luxo a Seul', author: 'Mariana Santos', status: 'published', excerpt: 'Dicas completas para planejar sua viagem premium para Seul.' },
    { slug: 'top-5-templos-tradicionais-em-quioto', title: 'Top 5 Templos Tradicionais em Quioto', author: 'Bruno Almeida', status: 'published', excerpt: 'Os templos mais incríveis para visitar em Quioto.' },
  ];
  for (const p of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, content: `<p>${p.excerpt}</p>`, publishedAt: new Date() },
    });
  }

  // ─── FAQ ─────────────────────────────────────────────
  console.log('❓ Criando FAQ...');
  const faqs = [
    { question: 'Quanto tempo antes devo reservar minha viagem?', answer: 'Recomendamos reservar com pelo menos 3 meses de antecedência para garantir disponibilidade e melhores tarifas.', category: 'Geral', sortOrder: 1 },
    { question: 'A Maeum oferece suporte durante a viagem?', answer: 'Sim! Oferecemos suporte 24/7 via WhatsApp para todos os viajantes durante toda a experiência.', category: 'Geral', sortOrder: 2 },
    { question: 'Quais documentos preciso para viajar para a Coreia do Sul?', answer: 'Brasileiros necessitam de passaporte com validade mínima de 6 meses e visto K-ETA para turismo.', category: 'Coreia do Sul', sortOrder: 3 },
    { question: 'Os programas de intercâmbio incluem acomodação?', answer: 'Sim, todos os programas de intercâmbio incluem acomodação, seguro saúde e suporte local.', category: 'Intercâmbio', sortOrder: 4 },
    { question: 'Como funcionam os pagamentos?', answer: 'Aceitamos PIX, transferência bancária e cartões internacionais. Parcelamos em até 12x.', category: 'Pagamentos', sortOrder: 5 },
  ];
  for (const f of faqs) {
    const existing = await prisma.faqItem.findFirst({ where: { question: f.question } });
    if (!existing) await prisma.faqItem.create({ data: f });
  }

  // ─── DEPOIMENTOS ─────────────────────────────────────────────
  console.log('⭐ Criando depoimentos...');
  const testimonials = [
    { name: 'Ana Beatriz', destination: 'Coreia do Sul - 2026', text: 'A Maeum tornou meu intercâmbio inesquecível. Cada detalhe foi pensado com carinho e profissionalismo. Recomendo de olhos fechados!', rating: 5, status: 'approved' },
    { name: 'Lucas Mendes', destination: 'Experiência K-Beauty', text: 'O roteiro de beleza coreana superou todas as expectativas. Clínicas incríveis e acompanhamento impecável.', rating: 5, status: 'approved' },
    { name: 'Carla Oliveira', destination: 'Jornada Essência da Coreia', text: 'Viajar em grupo com a Maeum foi uma experiência transformadora.', rating: 4, status: 'pending' },
    { name: 'Rafael Costa', destination: 'Intercâmbio Lexis Korea', text: 'O suporte antes, durante e depois é sensacional.', rating: 5, status: 'approved' },
  ];
  for (let i = 0; i < testimonials.length; i++) {
    const existing = await prisma.testimonial.findFirst({ where: { name: testimonials[i].name } });
    if (!existing) await prisma.testimonial.create({ data: { ...testimonials[i], sortOrder: i } });
  }

  // ─── CONFIGURAÇÕES DO SITE ─────────────────────────────────
  console.log('⚙️ Criando configurações do site...');
  const configs = [
    { section: 'brand', configKey: 'name', value: 'Maeum Global' },
    { section: 'brand', configKey: 'tagline', value: 'Viagens de Luxo, Intercâmbios e Experiências Exclusivas na Ásia' },
    { section: 'brand', configKey: 'logo_url', value: '/logo.svg' },
    { section: 'brand', configKey: 'favicon_url', value: '/favicon.ico' },
    { section: 'brand', configKey: 'footer_logo_url', value: '/logo-branco.svg' },
    { section: 'contact', configKey: 'email', value: 'contato@maeumglobal.com' },
    { section: 'contact', configKey: 'sales_email', value: 'vendas@maeumglobal.com' },
    { section: 'contact', configKey: 'phone', value: '+55 (41) 98709-4799' },
    { section: 'contact', configKey: 'whatsapp', value: '+5541987094799' },
    { section: 'contact', configKey: 'address', value: 'Av. Batel 1230, Curitiba, PR, Brasil' },
    { section: 'social', configKey: 'instagram', value: 'https://instagram.com/maeumglobal' },
    { section: 'social', configKey: 'facebook', value: 'https://facebook.com/maeumglobal' },
    { section: 'social', configKey: 'youtube', value: 'https://youtube.com/@maeumglobal' },
    { section: 'social', configKey: 'tiktok', value: 'https://tiktok.com/@maeumglobal' },
    { section: 'seo', configKey: 'title_suffix', value: '| Maeum Global Travel' },
    { section: 'seo', configKey: 'meta_description', value: 'Descubra roteiros de luxo exclusivos, intercâmbios e experiências na Ásia.' },
    { section: 'legal', configKey: 'cnpj', value: '00.000.000/0001-00' },
    { section: 'legal', configKey: 'company_name', value: 'Maeum Global Travel Ltda.' },
    { section: 'legal', configKey: 'privacy_url', value: '/politica-de-privacidade' },
    { section: 'legal', configKey: 'terms_url', value: '/termos-de-uso' },
    { section: 'visual', configKey: 'primary_color', value: '#D4AF37' },
    { section: 'visual', configKey: 'secondary_color', value: '#1C0A10' },
    { section: 'visual', configKey: 'accent_color', value: '#C8A27C' },
    { section: 'visual', configKey: 'background_color', value: '#110508' },
  ];
  for (const c of configs) {
    await prisma.siteConfig.upsert({
      where: { section_configKey: { section: c.section, configKey: c.configKey } },
      update: { value: c.value },
      create: c,
    });
  }

  // ─── NAVEGAÇÃO ─────────────────────────────────────────────
  console.log('🔗 Criando itens de navegação...');
  const navItems = [
    { navigationType: 'main', label: 'Início', url: '/', sortOrder: 0 },
    { navigationType: 'main', label: 'Coreia do Sul', url: '/coreia-do-sul', sortOrder: 1 },
    { navigationType: 'main', label: 'Destinos', url: '/destinos', sortOrder: 2 },
    { navigationType: 'main', label: 'Experiências', url: '/coreia-do-sul/experiencias', sortOrder: 3 },
    { navigationType: 'main', label: 'Jornadas', url: '/coreia-do-sul/jornadas', sortOrder: 4 },
    { navigationType: 'main', label: 'Intercâmbio', url: '/intercambios', sortOrder: 5 },
    { navigationType: 'main', label: 'Journal', url: '/journal', sortOrder: 6 },
    { navigationType: 'main', label: 'Contato', url: '/contato', sortOrder: 7 },
    { navigationType: 'footer', label: 'Sobre Nós', url: '/sobre', sortOrder: 0 },
    { navigationType: 'footer', label: 'Experiências', url: '/coreia-do-sul/experiencias', sortOrder: 1 },
    { navigationType: 'footer', label: 'Jornadas', url: '/coreia-do-sul/jornadas', sortOrder: 2 },
    { navigationType: 'footer', label: 'Política de Privacidade', url: '/politica-de-privacidade', sortOrder: 3 },
    { navigationType: 'footer', label: 'Contato', url: '/contato', sortOrder: 4 },
  ];
  for (const n of navItems) {
    const existing = await prisma.navigationItem.findFirst({ where: { navigationType: n.navigationType, url: n.url } });
    if (!existing) await prisma.navigationItem.create({ data: n });
  }

  // ─── CMS PAGES ─────────────────────────────────────────────
  console.log('📄 Criando páginas CMS...');
  const pages = [
    { slug: 'sobre', title: 'Sobre Nós', content: '<h2>Sobre a Maeum Global</h2><p>Somos uma agência especializada em viagens de luxo para a Ásia.</p>', status: 'published' },
    { slug: 'faq', title: 'FAQ', content: '<h2>Perguntas Frequentes</h2>', status: 'draft' },
  ];
  for (const p of pages) {
    await prisma.cmsPage.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // ─── CMS BLOCKS ─────────────────────────────────────────────
  console.log('🧱 Criando CMS blocks...');
  const blocks = [
    { pageName: 'home', sectionId: 'hero', blockType: 'hero', content: JSON.stringify({ title: 'Descubra a Ásia antes mesmo de embarcar.', subtitle: 'Histórias, dicas e experiências reais.', btnText: 'ASSISTIR AO VÍDEO', btnLink: '#', bgImage: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1920' }), sortOrder: 0, isActive: true },
  ];
  for (const b of blocks) {
    const existing = await prisma.cmsBlock.findFirst({ where: { pageName: b.pageName, sectionId: b.sectionId } });
    if (!existing) await prisma.cmsBlock.create({ data: b });
  }

  // ─── PARCEIRO ─────────────────────────────────────────────
  console.log('🤝 Criando parceiros...');
  await prisma.partner.upsert({
    where: { id: 'partner-lexis-001' },
    update: {},
    create: {
      id: 'partner-lexis-001',
      name: 'Lexis Korea',
      category: 'exchange',
      contactEmail: 'info@lexiskorea.com',
      website: 'https://lexiskorea.com',
      status: 'active',
    },
  });

  // ─── INTERCÂMBIO ─────────────────────────────────────────────
  console.log('🎓 Criando parceiro de intercâmbio...');
  const institution = await prisma.exchangeInstitution.upsert({
    where: { slug: 'lexis-korea' },
    update: {},
    create: {
      name: 'Lexis Korea',
      slug: 'lexis-korea',
      description: 'Escola de idiomas premium na Coreia do Sul.',
      country: 'Coreia do Sul',
      website: 'https://lexiskorea.com',
      isActive: true,
    },
  });

  const campus = await prisma.exchangeCampus.upsert({
    where: { id: 'campus-gangnam-001' },
    update: {},
    create: {
      id: 'campus-gangnam-001',
      institutionId: institution.id,
      name: 'Gangnam',
      city: 'Seul',
      location: 'Gangnam-gu, Seul',
      mainImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800',
      isActive: true,
    },
  });

  await prisma.exchangeProgram.upsert({
    where: { slug: 'intensive-korean-gangnam' },
    update: {},
    create: {
      campusId: campus.id,
      name: 'Intensive Korean',
      slug: 'intensive-korean-gangnam',
      description: 'Programa intensivo de coreano - 20 aulas por semana.',
      durationWeeksMin: 1,
      durationWeeksMax: 52,
      classesPerWeek: 20,
      levelRequired: 'Todos os níveis',
      pricingTiers: JSON.stringify([
        { range: '1-9', min: 1, max: 9, price_per_week: 375000, currency: 'KRW' },
        { range: '10-19', min: 10, max: 19, price_per_week: 365000, currency: 'KRW' },
        { range: '20+', min: 20, max: 999, price_per_week: 345000, currency: 'KRW' },
      ]),
      enrollmentFee: 100000,
      materialFee: 50000,
      isActive: true,
    },
  });

  // ─── K-BEAUTY ─────────────────────────────────────────────
  console.log('💄 Criando experiências K-Beauty...');
  await prisma.kbeautyExperience.upsert({
    where: { slug: 'sua-pele-o-cuidado-coreano' },
    update: {},
    create: {
      slug: 'sua-pele-o-cuidado-coreano',
      title: 'Sua Pele, o Cuidado Coreano',
      subtitle: 'Cuidados com a pele e maquiagem K-Beauty.',
      location: 'Seul',
      description: 'Imersão em cuidados com a pele K-Beauty.',
      highlights: JSON.stringify(['Profissional especializada', 'Skincare', 'Maquiagem K-Beauty']),
      included: JSON.stringify(['Orientação', 'Skincare', 'Maquiagem']),
      durationHours: 2,
      pricePerPerson: 1050,
      mainImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800',
      status: 'active',
      bookingType: 'request',
      availableFrom: new Date('2026-08-25'),
    },
  });

  // ─── NOTIFICAÇÃO INICIAL ─────────────────────────────────
  console.log('🔔 Criando notificação inicial...');
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'Sistema Inicializado com Sucesso',
      message: 'Bem-vindo ao Painel Administrativo da Maeum Global. Todos os dados foram carregados com sucesso.',
      type: 'success',
      priority: 'normal',
      category: 'system',
      linkUrl: '/dashboard/admin',
    },
  });

  // ─── LOG INICIAL ─────────────────────────────────
  console.log('📊 Criando log inicial...');
  await prisma.adminLog.create({
    data: {
      userId: adminUser.id,
      action: 'system_init',
      entity: 'system',
      details: JSON.stringify({ message: 'Banco de dados inicializado com seed completo.' }),
      result: 'success',
    },
  });

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
