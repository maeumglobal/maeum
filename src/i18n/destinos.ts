import type { Locale } from './config';

const pt: Record<string, string> = {};
const en: Record<string, string> = {};
const es: Record<string, string> = {};

export const raw: Record<Locale, Record<string, string>> = { pt, en, es };

function add(key: string, enVal: string, esVal: string) {
  pt[key] = key;
  en[key] = enVal;
  es[key] = esVal;
}

// ---------------------------------------------------------------------------
// DESTINOS
// ---------------------------------------------------------------------------
add('Destinos na Coreia', 'Destinations in Korea', 'Destinos en Corea');
add('Destinos na Coreia Mobile', 'Destinations in Korea Mobile', 'Destinos en Corea Móvil');
add('DESTINOS', 'DESTINATIONS', 'DESTINOS');
add('Descubra a', 'Discover', 'Descubre');
add('Coreia do Sul', 'South Korea', 'Corea del Sur');
add(
  'Quatro destinos, infinitas possibilidades. Da modernidade vibrante à natureza intocada, cada cidade oferece experiências únicas que vão transformar a sua viagem em memórias inesquecíveis.',
  'Four destinations, endless possibilities. From vibrant modernity to untouched nature, each city offers unique experiences that will turn your trip into unforgettable memories.',
  'Cuatro destinos, infinitas posibilidades. De la modernidad vibrante a la naturaleza intacta, cada ciudad ofrece experiencias únicas que convertirán tu viaje en recuerdos inolvidables.'
);
add('PLANEJE SUA JORNADA', 'PLAN YOUR JOURNEY', 'PLANIFICA TU JORNADA');
add('A COREIA DO SUL', 'SOUTH KOREA', 'COREA DEL SUR');
add(
  'Um país que combina tradição e inovação como poucos. Explore o melhor de cada região com roteiros feitos para você viver o que a Coreia tem de mais especial.',
  'A country that combines tradition and innovation like few others. Explore the best of each region with itineraries made for you to experience the most special side of Korea.',
  'Un país que combina tradición e innovación como pocos. Explora lo mejor de cada región con itinerarios hechos para que vivas lo más especial de Corea.'
);
add('Capital e coração', 'Capital and heart', 'Capital y corazón');
add('da Coreia.', 'of Korea.', 'de Corea.');
add('Cultura local', 'Local culture', 'Cultura local');
add('e história viva.', 'and living history.', 'e historia viva.');
add('Praias, mar', 'Beaches, sea', 'Playas, mar');
add('e energia única.', 'and unique energy.', 'y energía única.');
add('Natureza paradisíaca', 'Paradise nature', 'Naturaleza paradisíaca');
add('e tranquilidade.', 'and tranquility.', 'y tranquilidad.');
add('CONHEÇA NOSSOS DESTINOS', 'DISCOVER OUR DESTINATIONS', 'CONOCE NUESTROS DESTINOS');
add(
  'Tradição e modernidade lado a lado. Palácios históricos, bairros vibrantes, compras, cafés e a energia de uma metrópole que nunca para.',
  'Tradition and modernity side by side. Historic palaces, vibrant neighborhoods, shopping, cafés and the energy of a metropolis that never stops.',
  'Tradición y modernidad lado a lado. Palacios históricos, barrios vibrantes, compras, cafés y la energía de una metrópoli que nunca se detiene.'
);
add(
  'O mar, as montanhas e uma atmosfera descontraída. Praias, templos à beira-mar, passeios únicos e uma gastronomia que é de dar água na boca.',
  'The sea, the mountains and a relaxed atmosphere. Beaches, seaside temples, unique tours and mouth-watering cuisine.',
  'El mar, las montañas y un ambiente relajado. Playas, templos junto al mar, paseos únicos y una gastronomía que hace agua la boca.'
);
add(
  'A Coreia que muitos ainda não conhecem. Cidades acolhedora, rica em cultura local, ruas históricas e cafés encantadores.',
  'The Korea that many still do not know. A welcoming city, rich in local culture, historic streets and charming cafés.',
  'La Corea que muchos aún no conocen. Una ciudad acogedora, rica en cultura local, calles históricas y cafés encantadores.'
);
add(
  'A ilha mais amada da Coreia. Natureza exuberante, trilhas, cachoeiras, campos de flores e paisagens que parecem ter saído de um sonho.',
  'Korea’s most beloved island. Exuberant nature, trails, waterfalls, flower fields and landscapes that seem to come straight out of a dream.',
  'La isla más amada de Corea. Naturaleza exuberante, senderos, cascadas, campos de flores y paisajes que parecen salidos de un sueño.'
);
add('Cultura', 'Culture', 'Cultura');
add('Compras', 'Shopping', 'Compras');
add('Gastronomia', 'Gastronomy', 'Gastronomía');
add('Vida Noturna', 'Nightlife', 'Vida Nocturna');
add('Praias', 'Beaches', 'Playas');
add('Templos', 'Temples', 'Templos');
add('Mercados', 'Markets', 'Mercados');
add('Cultura Local', 'Local Culture', 'Cultura Local');
add('Cafés', 'Cafés', 'Cafés');
add('História', 'History', 'Historia');
add('Natureza', 'Nature', 'Naturaleza');
add('Trilhas', 'Trails', 'Senderos');
add('Cachoeiras', 'Waterfalls', 'Cascadas');
add('Relaxamento', 'Relaxation', 'Relajación');
add('O QUE TORNA A COREIA DO SUL ESPECIAL', 'WHAT MAKES SOUTH KOREA SPECIAL', 'LO QUE HACE ESPECIAL A COREA DEL SUR');
add('Hospitalidade', 'Hospitality', 'Hospitalidad');
add('Um povo acolhedor', 'A welcoming people', 'Un pueblo acogedor');
add('e experiências', 'and experiences', 'y experiencias');
add('autênticas.', 'authentic.', 'auténticas.');
add('Cultura Vibrante', 'Vibrant Culture', 'Cultura Vibrante');
add('Tradições milenares', 'Ancient traditions', 'Tradiciones milenarias');
add('e a influência pop', 'and the pop influence', 'y la influencia pop');
add('que conquista o mundo.', 'that conquers the world.', 'que conquista el mundo.');
add('Natureza Diversa', 'Diverse Nature', 'Naturaleza Diversa');
add('Montanhas, ilhas, praias', 'Mountains, islands, beaches', 'Montañas, islas, playas');
add('e paisagens para todos', 'and landscapes for all', 'y paisajes para todos');
add('os estilos de viajantes.', 'traveler styles.', 'los estilos de viajeros.');
add('Gastronomia Única', 'Unique Gastronomy', 'Gastronomía Única');
add('Sabores marcantes', 'Bold flavors', 'Sabores marcantes');
add('e pratos que são uma', 'and dishes that are', 'y platos que son una');
add('experiência à parte.', 'an experience on their own.', 'experiencia aparte.');
add('Compras e Beleza', 'Shopping and Beauty', 'Compras y Belleza');
add('Do K-beauty à moda,', 'From K-beauty to fashion,', 'Del K-beauty a la moda,');
add('tudo que você precisa', 'everything you need', 'todo lo que necesitas');
add('em um só lugar.', 'in one place.', 'en un solo lugar.');
add('Experiências Exclusivas', 'Exclusive Experiences', 'Experiencias Exclusivas');
add('Roteiros personalizados', 'Personalized itineraries', 'Itinerarios personalizados');
add('que vão além do óbvio e', 'that go beyond the obvious and', 'que van más allá de lo obvio y');
add('dos pontos turísticos.', 'the tourist spots.', 'de los puntos turísticos.');
add('Palácio Gyeongbokgung ao pôr do sol', 'Gyeongbokgung Palace at Sunset', 'Palacio Gyeongbokgung al atardecer');
add('Mais do que destinos,', 'More than destinations,', 'Más que destinos,');
add('criamos jornadas.', 'we create journeys.', 'creamos jornadas.');
add(
  'Conte com especialistas que vivem a Coreia para planejar cada detalhe da sua viagem e transformar sonhos em realidade.',
  'Rely on specialists who live in Korea to plan every detail of your trip and turn dreams into reality.',
  'Cuenta con especialistas que viven en Corea para planear cada detalle de tu viaje y convertir sueños en realidad.'
);
add('SOLICITAR PLANEJAMENTO', 'REQUEST PLANNING', 'SOLICITAR PLANIFICACIÓN');
add('CONHECER JORNADAS', 'DISCOVER JOURNEYS', 'CONOCER JORNADAS');
add('Segurança', 'Safety', 'Seguridad');
add('Suporte completo', 'Full support', 'Soporte completo');
add('antes e durante', 'before and during', 'antes y durante');
add('sua viagem.', 'your trip.', 'tu viaje.');
add('Consultoria', 'Consulting', 'Consultoría');
add('Especializada', 'Specialized', 'Especializada');
add('Atendimento humanizado', 'Humanized service', 'Atención humanizada');
add('e em português.', 'and in Portuguese.', 'y en portugués.');
add('Roteiros', 'Itineraries', 'Itinerarios');
add('Personalizados', 'Personalized', 'Personalizados');
add('Cada detalhe pensado', 'Every detail thought out', 'Cada detalle pensado');
add('para você.', 'for you.', 'para ti.');
add('Parcerias', 'Partnerships', 'Alianzas');
add('Confiáveis', 'Reliable', 'Confiables');
add('Os melhores parceiros', 'The best partners', 'Los mejores socios');
add('na Coreia do Sul.', 'in South Korea.', 'en Corea del Sur.');
add('Experiências', 'Experiences', 'Experiencias');
add('Autênticas', 'Authentic', 'Auténticas');
add('Vivencie o que a maioria', 'Experience what most', 'Vive lo que la mayoría');
add('dos turistas não vê.', 'tourists do not see.', 'de los turistas no ve.');
