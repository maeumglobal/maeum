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
// COREIA DO SUL (K-BEAUTY)
// ---------------------------------------------------------------------------
add('K-Beauty', 'K-Beauty', 'K-Beauty');
add('K-Beauty Experiences', 'K-Beauty Experiences', 'K-Beauty Experiences');
add('K-Beauty Signature', 'K-Beauty Signature', 'K-Beauty Signature');
add('K-Beauty nas Jornadas Cheotnun', 'K-Beauty in Cheotnun Journeys', 'K-Beauty en Jornadas Cheotnun');
add('Coreia do Sul', 'South Korea', 'Corea del Sur');
add('Uma curadoria exclusiva de experiências de beleza coreana — da rotina de skincare aos rituais de bem-estar que transformam a forma como você cuida de si.', 'An exclusive curation of Korean beauty experiences — from skincare routines to wellness rituals that transform the way you take care of yourself.', 'Una curaduría exclusiva de experiencias de belleza coreana — de la rutina de skincare a los rituales de bienestar que transforman la forma en que te cuidas.');
add('A Essência da Beleza Coreana', 'The Essence of Korean Beauty', 'La Esencia de la Belleza Coreana');
add('A Coreia não inventou o skincare — ela o aperfeiçoou como forma de arte.', 'Korea didn\'t invent skincare — it perfected it as an art form.', 'Corea no inventó el skincare — lo perfeccionó como una forma de arte.');
add('Na Maeum Global, acreditamos que a verdadeira beleza coreana vai além dos 10 passos. É sobre o ritual, a intenção e o conhecimento transmitido entre gerações. Nossas experiências K-Beauty são desenhadas para oferecer um mergulho autêntico no universo da estética coreana — seja através de consultas com especialistas, workshops de skincare personalizados ou vivências imersivas em clínicas e estúdios selecionados.', 'At Maeum Global, we believe true Korean beauty goes beyond the 10 steps. It is about the ritual, the intention and the knowledge passed down through generations. Our K-Beauty experiences are designed to offer an authentic dive into the Korean aesthetics universe — whether through consultations with specialists, personalized skincare workshops or immersive experiences at selected clinics and studios.', 'En Maeum Global creemos que la verdadera belleza coreana va más allá de los 10 pasos. Se trata del ritual, la intención y el conocimiento transmitido entre generaciones. Nuestras experiencias K-Beauty están diseñadas para ofrecer una inmersión auténtica en el universo de la estética coreana — ya sea mediante consultas con especialistas, talleres personalizados de skincare o vivencias inmersivas en clínicas y estudios seleccionados.');
add('Cada experiência é individualmente contratável e pode ser adicionada ao seu roteiro, permitindo que você construa a jornada de beleza que faz sentido para você.', 'Each experience can be booked individually and added to your itinerary, letting you build the beauty journey that makes sense for you.', 'Cada experiencia es contratable de forma individual y puede añadirse a tu itinerario, permitiéndote construir la jornada de belleza que tenga sentido para ti.');
add('Experiência em Destaque', 'Featured Experience', 'Experiencia Destacada');
add('Incluso', 'Included', 'Incluido');
add('Solicitar reserva', 'Request booking', 'Solicitar reserva');
add('Parceiros', 'Partners', 'Socios');
add('Empresas Parceiras', 'Partner Companies', 'Empresas Socias');
add('Em breve: experiências K-Beauty por empresas parceiras selecionadas.', 'Coming soon: K-Beauty experiences by selected partner companies.', 'Próximamente: experiencias K-Beauty de empresas socias seleccionadas.');
add('Jornadas em Grupo', 'Group Journeys', 'Jornadas en Grupo');
add('As experiências K-Beauty também estão incluídas em nossas jornadas em grupo Cheotnun, onde o cuidado com a pele e o bem-estar fazem parte da experiência completa de imersão na Coreia. Descubra como a beleza coreana se integra a cada momento da sua viagem.', 'K-Beauty experiences are also included in our Cheotnun group journeys, where skincare and wellness are part of the complete immersion experience in Korea. Discover how Korean beauty weaves into every moment of your trip.', 'Las experiencias K-Beauty también están incluidas en nuestras jornadas grupales Cheotnun, donde el cuidado de la piel y el bienestar forman parte de la experiencia completa de inmersión en Corea. Descubre cómo la belleza coreana se integra en cada momento de tu viaje.');
add('Conhecer Jornadas', 'Discover Journeys', 'Conocer Jornadas');
add('Viagens em grupo com curadoria exclusiva', 'Group travel with exclusive curation', 'Viajes en grupo con curaduría exclusiva');
add('Uma nova forma de viajar', 'A new way to travel', 'Una nueva forma de viajar');
add('Nossas jornadas em grupo são muito mais que roteiros turísticos — são experiências cuidadosamente desenhadas para conectar você com a essência da Coreia do Sul ao lado de outras viajantes que compartilham dos mesmos sonhos.', 'Our group journeys are much more than tourist itineraries — they are carefully designed experiences that connect you with the essence of South Korea alongside other travelers who share the same dreams.', 'Nuestras jornadas grupales son mucho más que itinerarios turísticos — son experiencias cuidadosamente diseñadas para conectarte con la esencia de Corea del Sur junto a otras viajeras que comparten los mismos sueños.');
add('Cada jornada inclui acompanhamento exclusivo Maeum, hospedagem selecionada, experiências curadas e todo o suporte para que você viva cada momento com profundidade e significado.', 'Every journey includes exclusive Maeum support, selected accommodations, curated experiences and full assistance so you can live each moment with depth and meaning.', 'Cada jornada incluye acompañamiento exclusivo Maeum, alojamiento seleccionado, experiencias curadas y todo el soporte para que vivas cada momento con profundidad y significado.');
add('Nenhuma jornada disponível no momento', 'No journeys available at the moment', 'Ninguna jornada disponible por el momento');
add('Novas jornadas estão sendo preparadas. Volte em breve.', 'New journeys are being prepared. Come back soon.', 'Nuevas jornadas se están preparando. Vuelve pronto.');
add('Premium', 'Premium', 'Premium');
add('dias', 'days', 'días');
add('vagas disponíveis', 'spots available', 'plazas disponibles');
add('pessoa', 'person', 'persona');
add('CONHECER JORNADA', 'DISCOVER JOURNEY', 'CONOCER JORNADA');