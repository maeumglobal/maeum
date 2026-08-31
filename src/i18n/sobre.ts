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
// SOBRE / SOBRE-NOS
// ---------------------------------------------------------------------------
add('Sobre a Maeum Global Desktop', 'About Maeum Global Desktop', 'Sobre Maeum Global Escritorio');
add('Sobre a Maeum Global Mobile', 'About Maeum Global Mobile', 'Sobre Maeum Global Móvil');
add('Agência Maeum Desktop', 'Maeum Agency Desktop', 'Agencia Maeum Escritorio');
add('Agência Maeum Mobile', 'Maeum Agency Mobile', 'Agencia Maeum Móvil');
add('SOBRE A MAEUM GLOBAL', 'ABOUT MAEUM GLOBAL', 'SOBRE MAEUM GLOBAL');
add('Muito mais que', 'Far more than', 'Mucho más que');
add('viagens. Criamos', 'travel. We create', 'viajes. Creamos');
add('conexões que transformam.', 'connections that transform.', 'conexiones que transforman.');
add('A Maeum Global nasceu do desejo de proporcionar experiências autênticas, profundas e transformadoras na Coreia do Sul.', 'Maeum Global was born from the desire to provide authentic, deep and transformative experiences in South Korea.', 'Maeum Global nació del deseo de ofrecer experiencias auténticas, profundas y transformadoras en Corea del Sur.');
add('Acreditamos que cada viagem é única e deve refletir a essência de quem viaja. Por isso, cada roteiro é cuidadosamente planejado, com curadoria premium e atenção a cada detalhe.', 'We believe every trip is unique and should reflect who you are. That is why every itinerary is carefully planned, with premium curation and attention to every detail.', 'Creemos que cada viaje es único y debe reflejar la esencia de quien viaja. Por eso, cada itinerario se planifica cuidadosamente, con curaduría premium y atención a cada detalle.');
add('CONHEÇA NOSSAS JORNADAS', 'DISCOVER OUR JOURNEYS', 'CONOCE NUESTRAS JORNADAS');
add('NOSSOS VALORES', 'OUR VALUES', 'NUESTROS VALORES');
add('PROPÓSITO', 'PURPOSE', 'PROPÓSITO');
add('Criar experiências que conectam pessoas, culturas e histórias.', 'Create experiences that connect people, cultures and stories.', 'Crear experiencias que conecten personas, culturas e historias.');
add('EXCLUSIVIDADE', 'EXCLUSIVITY', 'EXCLUSIVIDAD');
add('Grupos pequenos, roteiros autorais e acesso a experiências únicas.', 'Small groups, signature itineraries and access to unique experiences.', 'Grupos pequeños, itinerarios de autor y acceso a experiencias únicas.');
add('CONFIANÇA', 'TRUST', 'CONFIANZA');
add('Acompanhamento desde o Brasil e suporte completo durante toda a jornada.', 'Support from Brazil and full assistance throughout the entire journey.', 'Acompañamiento desde Brasil y soporte completo durante toda la jornada.');
add('AUTENTICIDADE', 'AUTHENTICITY', 'AUTENTICIDAD');
add('EXCELÊNCIA', 'EXCELLENCE', 'EXCELENCIA');
add('Padrão premium em cada detalhe da sua viagem.', 'Premium standard in every detail of your trip.', 'Estándar premium en cada detalle de tu viaje.');
add('VIAJANTES REALIZADOS', 'TRAVELERS DELIVERED', 'VIAJEROS SATISFECHOS');
add('SATISFAÇÃO', 'SATISFACTION', 'SATISFACCIÓN');
add('EXPERIÊNCIAS EXCLUSIVAS', 'EXCLUSIVE EXPERIENCES', 'EXPERIENCIAS EXCLUSIVAS');
add('AVALIAÇÃO MÉDIA', 'AVERAGE RATING', 'CALIFICACIÓN MEDIA');
add('NOSSOS PARCEIROS', 'OUR PARTNERS', 'NUESTROS SOCIOS');
add('Trabalhamos com marcas e profissionais que compartilham dos nossos valores e garantem experiências autênticas, seguras e memoráveis.', 'We work with brands and professionals who share our values and ensure authentic, safe and memorable experiences.', 'Trabajamos con marcas y profesionales que comparten nuestros valores y garantizan experiencias auténticas, seguras y memorables.');
add('K-BEAUTY EXPERIENCE', 'K-BEAUTY EXPERIENCE', 'EXPERIENCIA K-BEAUTY');
add('PERFUMARIA COREANA', 'KOREAN PERFUMERY', 'PERFUMERÍA COREANA');
add('ESCOLA DE IDIOMAS', 'LANGUAGE SCHOOL', 'ESCUELA DE IDIOMAS');
add('KTX TRENS', 'KTX TRAINS', 'TRENES KTX');
add('CONHEÇA NOSSOS PARCEIROS', 'DISCOVER OUR PARTNERS', 'CONOCE NUESTROS SOCIOS');
add('VAMOS CRIAR ALGO EXTRAORDINÁRIO JUNTOS?', 'LET\'S CREATE SOMETHING EXTRAORDINARY TOGETHER?', '¿CREAMOS ALGO EXTRAORDINARIO JUNTOS?');
add('Se você representa uma marca, negócio ou oferece experiências na Coreia, vamos conversar.', 'If you represent a brand, business or offer experiences in Korea, let\'s talk.', 'Si representas una marca, negocio u ofreces experiencias en Corea, hablemos.');
add('A Maeum Global está sempre aberta a novas parcerias que acrescentam valor às nossas jornadas. Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.', 'Maeum Global is always open to new partnerships that add value to our journeys. If you want to promote your brand, product or service to a select and highly engaged audience, get in touch with us.', 'Maeum Global siempre está abierta a nuevas alianzas que aporten valor a nuestras jornadas. Si deseas promover tu marca, producto o servicio ante una audiencia seleccionada y muy comprometida, ponte en contacto con nosotros.');
add('Envie sua proposta para:', 'Send your proposal to:', 'Envía tu propuesta a:');
add('VISIBILIDADE', 'VISIBILITY', 'VISIBILIDAD');
add('Exposição para um público seleto e qualificado.', 'Exposure to a select and qualified audience.', 'Exposición a una audiencia seleccionada y calificada.');
add('PARCERIAS REAIS', 'REAL PARTNERSHIPS', 'ALIANZAS REALES');
add('Trabalhamos juntos para criar experiências únicas.', 'We work together to create unique experiences.', 'Trabajamos juntos para crear experiencias únicas.');
add('CONEXÕES', 'CONNECTIONS', 'CONEXIONES');
add('Fortalecemos culturas, negócios e pessoas.', 'We strengthen cultures, businesses and people.', 'Fortalecer culturas, negocios y personas.');
add('MAEUM GLOBAL — SUA HISTÓRIA NA COREIA, DO SEU JEITO, COM EXCELÊNCIA.', 'MAEUM GLOBAL — YOUR STORY IN KOREA, ON YOUR OWN TERMS, WITH EXCELLENCE.', 'MAEUM GLOBAL — TU HISTORIA EN COREA, A TU MANERA, CON EXCELENCIA.');
add('Handshake', 'Handshake', 'Apretón de manos');
add('Parceria Maeum Global', 'Maeum Global Partnership', 'Alianza Maeum Global');
add('A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas.', 'Maeum Global is always open to new partnerships that add value to our journeys.', 'Maeum Global siempre está abierta a nuevas alianzas que aporten valor a nuestras jornadas.');
add(' A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas.', 'Maeum Global is always open to new partnerships that add value to our journeys.', 'Maeum Global siempre está abierta a nuevas alianzas que aporten valor a nuestras jornadas.');
add(' Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.', 'If you wish to promote your brand, product or service to a select and highly engaged audience, please contact us.', 'Si deseas promocionar tu marca, producto o servicio a una audiencia seleccionada y muy comprometida, contáctanos.');
add('Parcerias locais selecionadas e vivências além dos roteiros tradicionais.', 'Selected local partnerships and experiences beyond the traditional itineraries.', 'Asociaciones locales seleccionadas y vivencias más allá de los itinerarios tradicionales.');
add('A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas. Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.', 'Maeum Global is always open to new partnerships that add value to our journeys. If you want to promote your brand, product or service to a select and highly engaged audience, get in touch with us.', 'Maeum Global siempre está abierta a nuevas alianzas que aporten valor a nuestras jornadas. Si deseas promocionar tu marca, producto o servicio ante una audiencia seleccionada y muy comprometida, ponte en contacto con nosotros.');