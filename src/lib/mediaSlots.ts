// Catálogo de slots de mídia editáveis pelo painel admin.
// Cada slot tem uma chave semântica usada pelas páginas públicas e pelo
// editor de conteúdo. O fallback é o valor atual hardcoded da página.

export interface MediaSlot {
  key: string;
  label: string;
  page: string;
  fallback: string;
  type: 'banner_desktop' | 'banner_mobile' | 'banner_single' | 'card' | 'logo' | 'image';
}

export const MEDIA_SLOTS: MediaSlot[] = [
  // ── HOME ────────────────────────────────────────────────
  { key: 'home_hero_desktop', page: 'Home', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp' },
  { key: 'home_hero_mobile', page: 'Home', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-oficial-mobile.webp' },
  { key: 'home_card_1_army', page: 'Home', label: 'Card 1 (Projeto ARMY)', type: 'card', fallback: 'https://images.unsplash.com/photo-1596706935706-95ff817d2bb9?q=80&w=800' },
  { key: 'home_card_2_horizon', page: 'Home', label: 'Card 2 (Horizon of Seven)', type: 'card', fallback: 'https://images.unsplash.com/photo-1515091943-9d5c0ad20094?q=80&w=800' },
  { key: 'home_card_3_cheotnun', page: 'Home', label: 'Card 3 (Cheotnun)', type: 'card', fallback: 'https://images.unsplash.com/photo-1546874177-9e66487e671c?q=80&w=800' },
  { key: 'home_partnership_image', page: 'Home', label: 'Imagem Parceria K-Beauty', type: 'image', fallback: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800' },

  // ── DESTINOS ────────────────────────────────────────────
  { key: 'destinos_hero_desktop', page: 'Destinos', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-destinos.webp' },
  { key: 'destinos_hero_mobile', page: 'Destinos', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-destinos-mobile.webp' },
  { key: 'destinos_cta_banner', page: 'Destinos', label: 'Banner CTA Final', type: 'banner_single', fallback: 'https://images.unsplash.com/photo-1590209673531-1585f52e5a25?q=80&w=1600' },
  { key: 'destinos_card_seoul', page: 'Destinos', label: 'Card SEOUL', type: 'card', fallback: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=800' },
  { key: 'destinos_card_busan', page: 'Destinos', label: 'Card BUSAN', type: 'card', fallback: 'https://images.unsplash.com/photo-1588667590805-728b74f3ebda?q=80&w=800' },
  { key: 'destinos_card_daegu', page: 'Destinos', label: 'Card DAEGU', type: 'card', fallback: 'https://images.unsplash.com/photo-1590209673531-1585f52e5a25?q=80&w=800' },
  { key: 'destinos_card_jeju', page: 'Destinos', label: 'Card JEJU', type: 'card', fallback: 'https://images.unsplash.com/photo-1583098380252-16a75f5647a7?q=80&w=800' },

  // ── EXPERIÊNCIAS ────────────────────────────────────────
  { key: 'experiencias_hero_desktop', page: 'Experiências', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-experiencias.webp' },
  { key: 'experiencias_hero_mobile', page: 'Experiências', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-experiencias-mobile.webp' },
  { key: 'experiencias_memorias_image', page: 'Experiências', label: 'Imagem "Memórias"', type: 'image', fallback: 'https://images.unsplash.com/photo-1545657802-1845184bba02?q=80&w=800' },
  { key: 'experiencias_hanok_image', page: 'Experiências', label: 'Imagem "Hanok Night"', type: 'image', fallback: 'https://images.unsplash.com/photo-1588720164627-82ba694e82b7?q=80&w=600' },
  { key: 'experiencias_card_kbeauty', page: 'Experiências', label: 'Card K-Beauty', type: 'card', fallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400' },
  { key: 'experiencias_card_hanbok', page: 'Experiências', label: 'Card Hanbok', type: 'card', fallback: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=400' },
  { key: 'experiencias_card_perfume', page: 'Experiências', label: 'Card Perfume', type: 'card', fallback: 'https://images.unsplash.com/photo-1595425970377-c9703bc48b2d?q=80&w=400' },
  { key: 'experiencias_card_makgeolli', page: 'Experiências', label: 'Card Makgeolli', type: 'card', fallback: 'https://images.unsplash.com/photo-1582295525920-631620a8db08?q=80&w=400' },
  { key: 'experiencias_card_ceramica', page: 'Experiências', label: 'Card Cerâmica', type: 'card', fallback: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400' },
  { key: 'experiencias_card_bibimbap', page: 'Experiências', label: 'Card Bibimbap', type: 'card', fallback: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=400' },
  { key: 'experiencias_card_bojagi', page: 'Experiências', label: 'Card Bojagi', type: 'card', fallback: 'https://images.unsplash.com/photo-1584556488924-f7a93ce5b106?q=80&w=400' },
  { key: 'experiencias_card_han_bike', page: 'Experiências', label: 'Card Han River Bike', type: 'card', fallback: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=400' },
  { key: 'experiencias_card_foot_spa', page: 'Experiências', label: 'Card Foot Spa', type: 'card', fallback: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400' },
  { key: 'experiencias_card_photo', page: 'Experiências', label: 'Card Photo', type: 'card', fallback: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { key: 'experiencias_card_tea', page: 'Experiências', label: 'Card Tea Ceremony', type: 'card', fallback: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=400' },
  { key: 'experiencias_card_calligraphy', page: 'Experiências', label: 'Card Calligraphy', type: 'card', fallback: 'https://images.unsplash.com/photo-1555581977-7e2a9b6eb505?q=80&w=400' },
  { key: 'experiencias_card_temple_stay', page: 'Experiências', label: 'Card Temple Stay', type: 'card', fallback: 'https://images.unsplash.com/photo-1542450379-379659fdffc5?q=80&w=400' },
  { key: 'experiencias_card_kpop_dance', page: 'Experiências', label: 'Card K-Pop Dance', type: 'card', fallback: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=400' },
  { key: 'experiencias_card_hanok_dinner', page: 'Experiências', label: 'Card Hanok Dinner', type: 'card', fallback: 'https://images.unsplash.com/photo-1553956327-0b171f11e9f2?q=80&w=400' },

  // ── JORNADAS (lista) ────────────────────────────────────
  { key: 'jornadas_hero_desktop', page: 'Jornadas', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-jornadas.webp' },
  { key: 'jornadas_hero_mobile', page: 'Jornadas', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-jornadas-mobile.webp' },
  { key: 'jornadas_featured_card', page: 'Jornadas', label: 'Jornada em Destaque (sidebar)', type: 'card', fallback: 'https://images.unsplash.com/photo-1546874177-9e66487e671c?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_cta_banner', page: 'Jornadas', label: 'Banner CTA Final', type: 'banner_single', fallback: 'https://images.unsplash.com/photo-1601584989635-c337b51b3152?q=80&w=800' },
  { key: 'jornadas_recente_1', page: 'Jornadas', label: 'Post Recente 1 (Seul)', type: 'card', fallback: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_2', page: 'Jornadas', label: 'Post Recente 2 (Bukchon)', type: 'card', fallback: 'https://images.unsplash.com/photo-1515091943-9d5c0ad20094?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_3', page: 'Jornadas', label: 'Post Recente 3 (Busan)', type: 'card', fallback: 'https://images.unsplash.com/photo-1588667590805-728b74f3ebda?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_4', page: 'Jornadas', label: 'Post Recente 4 (Jeju)', type: 'card', fallback: 'https://images.unsplash.com/photo-1522020297063-e5dcf4a54c9c?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_5', page: 'Jornadas', label: 'Post Recente 5 (Gyeongbokgung)', type: 'card', fallback: 'https://images.unsplash.com/photo-1596706935706-95ff817d2bb9?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_6', page: 'Jornadas', label: 'Post Recente 6 (Hongdae)', type: 'card', fallback: 'https://images.unsplash.com/photo-1579738753235-51dc5d820468?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_7', page: 'Jornadas', label: 'Post Recente 7 (Gangnam)', type: 'card', fallback: 'https://images.unsplash.com/photo-1521404176332-901b0669287c?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_recente_8', page: 'Jornadas', label: 'Post Recente 8 (Gwangjang)', type: 'card', fallback: 'https://images.unsplash.com/photo-1563242099-0e782be6c97a?q=80&w=600&h=400&fit=crop' },
  { key: 'jornadas_avatar_1', page: 'Jornadas', label: 'Avatar Consultora (Juliana)', type: 'image', fallback: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  { key: 'jornadas_avatar_2', page: 'Jornadas', label: 'Avatar Consultora (Larissa)', type: 'image', fallback: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { key: 'jornadas_avatar_3', page: 'Jornadas', label: 'Avatar Consultora (Dayane)', type: 'image', fallback: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
  { key: 'jornadas_avatar_4', page: 'Jornadas', label: 'Avatar Consultora (Caroline)', type: 'image', fallback: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },

  // ── PACOTES ─────────────────────────────────────────────
  { key: 'pacotes_hero_desktop', page: 'Pacotes', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-home.webp' },
  { key: 'pacotes_hero_mobile', page: 'Pacotes', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-home-mobile.webp' },
  { key: 'pacotes_jornada_army', page: 'Pacotes', label: 'Jornada Founding ARMY', type: 'card', fallback: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=400' },
  { key: 'pacotes_jornada_bom_sarang', page: 'Pacotes', label: 'Jornada Bom Sarang', type: 'card', fallback: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=400' },
  { key: 'pacotes_jornada_caravana', page: 'Pacotes', label: 'Jornada Caravana de Verão', type: 'card', fallback: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=400' },
  { key: 'pacotes_jornada_always', page: 'Pacotes', label: 'Jornada Always Destination', type: 'card', fallback: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400' },
  { key: 'pacotes_jornada_horizon', page: 'Pacotes', label: 'Jornada Horizon of Seven', type: 'card', fallback: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400' },
  { key: 'pacotes_experiencia_1', page: 'Pacotes', label: 'Experiência Culinária', type: 'card', fallback: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=300' },
  { key: 'pacotes_experiencia_2', page: 'Pacotes', label: 'Experiência Cerâmica', type: 'card', fallback: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300' },
  { key: 'pacotes_experiencia_3', page: 'Pacotes', label: 'Experiência Hanbok', type: 'card', fallback: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=300' },
  { key: 'pacotes_experiencia_4', page: 'Pacotes', label: 'Experiência K-Pop Dance', type: 'card', fallback: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=300' },
  { key: 'pacotes_experiencia_5', page: 'Pacotes', label: 'Experiência Ensaio Foto', type: 'card', fallback: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=300' },
  { key: 'pacotes_experiencia_6', page: 'Pacotes', label: 'Experiência Trem Bala KTX', type: 'card', fallback: 'https://images.unsplash.com/photo-1516246471374-9cbfb9c66e2c?q=80&w=300' },
  { key: 'pacotes_experiencia_7', page: 'Pacotes', label: 'Experiência Cruzeiro Rio Han', type: 'card', fallback: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=300' },
  { key: 'pacotes_experiencia_8', page: 'Pacotes', label: 'Experiência Spa Coreano', type: 'card', fallback: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=300' },
  { key: 'pacotes_experiencia_9', page: 'Pacotes', label: 'Experiência Cerimônia do Chá', type: 'card', fallback: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=300' },
  { key: 'pacotes_experiencia_10', page: 'Pacotes', label: 'Experiência Banho em Floresta', type: 'card', fallback: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?q=80&w=300' },
  { key: 'pacotes_experiencia_11', page: 'Pacotes', label: 'Experiência K-Beauty', type: 'card', fallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300' },
  { key: 'pacotes_experiencia_12', page: 'Pacotes', label: 'Welcome Gift', type: 'card', fallback: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300' },
  { key: 'pacotes_destino_seoul', page: 'Pacotes', label: 'Destino SEOUL', type: 'card', fallback: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=600' },
  { key: 'pacotes_destino_busan', page: 'Pacotes', label: 'Destino BUSAN', type: 'card', fallback: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=600' },
  { key: 'pacotes_destino_daegu', page: 'Pacotes', label: 'Destino DAEGU', type: 'card', fallback: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600' },
  { key: 'pacotes_destino_jeju', page: 'Pacotes', label: 'Destino JEJU', type: 'card', fallback: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600' },
  { key: 'pacotes_incluso_banner', page: 'Pacotes', label: 'Banner "O que está incluso"', type: 'banner_single', fallback: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800' },
  { key: 'pacotes_cta_tradition', page: 'Pacotes', label: 'CTA Tradition (box final)', type: 'image', fallback: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=600' },

  // ── K-BEAUTY ────────────────────────────────────────────
  { key: 'kbeauty_hero', page: 'K-Beauty', label: 'Hero (única)', type: 'banner_single', fallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1920' },

  // ── JORNADAS (coreia-do-sul) ────────────────────────────
  { key: 'ks_jornadas_hero', page: 'Jornadas (coreia-do-sul)', label: 'Hero (única)', type: 'banner_single', fallback: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1920' },

  // ── INTERCÂMBIO ─────────────────────────────────────────
  { key: 'intercambio_hero_desktop', page: 'Intercâmbio', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-intercambio.webp' },
  { key: 'intercambio_hero_mobile', page: 'Intercâmbio', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-intercambio-mobile.webp' },

  // ── INTERCÂMBIOS ────────────────────────────────────────
  { key: 'intercambios_card_seul', page: 'Intercâmbios', label: 'Card Intercâmbio (Seul)', type: 'card', fallback: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600' },
  { key: 'intercambios_card_toquio', page: 'Intercâmbios', label: 'Card Semestre (Tóquio)', type: 'card', fallback: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600' },

  // ── JOURNAL ─────────────────────────────────────────────
  { key: 'journal_post_1', page: 'Journal', label: 'Post 1 (Gyeongbokgung)', type: 'card', fallback: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=600' },
  { key: 'journal_post_2', page: 'Journal', label: 'Post 2 (Mercado Gwangjang)', type: 'card', fallback: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600' },

  // ── SOBRE ───────────────────────────────────────────────
  { key: 'sobre_hero_desktop', page: 'Sobre', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos.webp' },
  { key: 'sobre_hero_mobile', page: 'Sobre', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos-mobile.webp' },
  { key: 'sobre_parceria_image', page: 'Sobre', label: 'Imagem Parceria', type: 'image', fallback: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=800' },

  // ── SOBRE NÓS ───────────────────────────────────────────
  { key: 'sobre_nos_hero_desktop', page: 'Sobre Nós', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos.webp' },
  { key: 'sobre_nos_hero_mobile', page: 'Sobre Nós', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos-mobile.webp' },
  { key: 'sobre_nos_parceria_image', page: 'Sobre Nós', label: 'Imagem Parceria (Handshake)', type: 'image', fallback: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800' },

  // ── CONTATO ─────────────────────────────────────────────
  { key: 'contato_hero_desktop', page: 'Contato', label: 'Hero Desktop', type: 'banner_desktop', fallback: '/images/agencia-viagens-coreia-do-sul-maeum-global-contato.webp' },
  { key: 'contato_hero_mobile', page: 'Contato', label: 'Hero Mobile', type: 'banner_mobile', fallback: '/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-contato-mobile.webp' },

  // ── LOGO ────────────────────────────────────────────────
  { key: 'site_logo', page: 'Site', label: 'Logo (Header e Footer)', type: 'logo', fallback: '/images/logo.png' },
];

export function getMediaSlot(key: string): MediaSlot | undefined {
  return MEDIA_SLOTS.find((s) => s.key === key);
}

export function getMediaSlotsByPage(): Record<string, MediaSlot[]> {
  const out: Record<string, MediaSlot[]> = {};
  for (const slot of MEDIA_SLOTS) {
    if (!out[slot.page]) out[slot.page] = [];
    out[slot.page].push(slot);
  }
  return out;
}