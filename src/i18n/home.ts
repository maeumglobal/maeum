import type { Locale } from './config';

/**
 * Flat translation dictionary. Keys are the Portuguese source strings
 * (matching what t('...') receives), values are the localized strings.
 */
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
// SHARED / NAV / FOOTER
// ---------------------------------------------------------------------------
add('Home', 'Home', 'Inicio');
add('Destinos', 'Destinations', 'Destinos');
add('Experiências', 'Experiences', 'Experiencias');
add('Intercâmbio', 'Exchange', 'Intercambio');
add('Pacotes', 'Packages', 'Paquetes');
add('Jornadas', 'Journeys', 'Jornadas');
add('Sobre Nós', 'About Us', 'Sobre Nosotros');
add('Contato', 'Contact', 'Contacto');
add('Meu Painel', 'My Dashboard', 'Mi Panel');
add('Sair da Conta', 'Logout', 'Cerrar Sesión');
add('Entrar', 'Login', 'Entrar');
add('Cadastrar', 'Sign Up', 'Registrarse');
add('SOLICITAR ORÇAMENTO', 'REQUEST QUOTE', 'SOLICITAR PRESUPUESTO');
add('Sessão:', 'Session:', 'Sesión:');
add('Português', 'Portuguese', 'Portugués');
add('Coreia com Profundidade Desktop', 'Korea with Depth Desktop', 'Corea con Profundidad Desktop');
add('Coreia com Profundidade Mobile', 'Korea with Depth Mobile', 'Corea con Profundidad Mobile');
add('Espanhol', 'Spanish', 'Español');
add('Inglês', 'English', 'Inglés');
add(
  'Conectamos você ao melhor da Ásia através de experiências autênticas, roteiros personalizados e suporte completo em cada etapa da sua jornada.',
  'We connect you to the best of Asia through authentic experiences, personalized itineraries and full support at every stage of your journey.',
  'Te conectamos con lo mejor de Asia mediante experiencias auténticas, itinerarios personalizados y soporte completo en cada etapa de tu viaje.'
);
add('Coreia do Sul', 'South Korea', 'Corea del Sur');
add('Visão geral', 'Overview', 'Visión general');
add('K-Beauty', 'K-Beauty', 'K-Beauty');
add('Próximas saídas', 'Upcoming departures', 'Próximas salidas');
add('Cheotnun', 'Cheotnun', 'Cheotnun');
add('MAEUM', 'MAEUM', 'MAEUM');
add('Projeto ARMY', 'ARMY Project', 'Proyecto ARMY');
add('Caravana de Verão', 'Summer Caravan', 'Caravana de Verano');
add('Journal', 'Journal', 'Journal');
add('Todos os vídeos', 'All videos', 'Todos los videos');
add('Guias completos', 'Complete guides', 'Guías completas');
add('Bastidores', 'Behind the scenes', 'Detrás de escena');
add('Vlogs', 'Vlogs', 'Vlogs');
add('Atendimento via WhatsApp', 'WhatsApp Support', 'Atención vía WhatsApp');
add('Todos os direitos reservados.', 'All rights reserved.', 'Todos los derechos reservados.');
add('Orgulhosamente desenvolvido por', 'Proudly developed by', 'Desarrollado orgullosamente por');
add('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad');
add('Termos de Uso', 'Terms of Use', 'Términos de Uso');
add('Reembolso', 'Refunds', 'Reembolso');
add('Em parceria com a ', 'In partnership with ', 'En colaboración con ');

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
add('COREIA COM PROFUNDIDADE', 'SOUTH KOREA, IN DEPTH', 'COREA CON PROFUNDIDAD');
add('Mais vivência.', 'More experience.', 'Más vivencia.');
add('Menos roteiro.', 'Less itinerary.', 'Menos itinerario.');
add('Só o que importa.', 'Only what matters.', 'Solo lo que importa.');
add('Experiências autorais criadas com quem vive a Coreia.', 'Signature experiences created by people who actually live in Korea.', 'Experiencias de autor creadas por quienes viven Corea.');
add('Você não vem apenas como turista.', 'You do not come as a mere tourist.', 'No vienes solo como turista.');
add('Você vive como parte da história.', 'You live as part of the story.', 'Vives como parte de la historia.');
add('EXPLORAR EXPERIÊNCIAS', 'EXPLORE EXPERIENCES', 'EXPLORAR EXPERIENCIAS');
add('CONHEÇA A MAEUM', 'GET TO KNOW MAEUM', 'CONOCE MAEUM');
add('Planeje sua viagem do seu jeito.', 'Plan your trip your way.', 'Planifica tu viaje a tu manera.');
add('Nos conte o que você imagina. Nós cuidamos de cada detalhe.', 'Tell us what you imagine. We take care of every detail.', 'Cuéntanos lo que imaginas. Nosotros cuidamos cada detalle.');
add('Especialistas locais', 'Local specialists', 'Especialistas locales');
add('Quem vive, conhece e seleciona.', 'Those who live it, know it and select it.', 'Quienes lo viven, lo conocen y lo seleccionan.');
add('Roteiros 100% personalizados', '100% personalized itineraries', 'Itinerarios 100% personalizados');
add('Nada engessado, tudo com intenção.', 'Nothing rigid, everything intentional.', 'Nada rígido, todo con intención.');
add('Acompanhamento 24/7', '24/7 support', 'Acompañamiento 24/7');
add('Antes, durante e depois da viagem.', 'Before, during and after your trip.', 'Antes, durante y después del viaje.');
add('Experiências autênticas', 'Authentic experiences', 'Experiencias auténticas');
add('Cultura, pessoas e lugares além do óbvio.', 'Culture, people and places beyond the obvious.', 'Cultura, personas y lugares más allá de lo obvio.');
add('JORNADAS QUE MARCAM', 'JOURNEYS THAT LAST', 'JORNADAS QUE MARCAN');
add('Viagens que viram', 'Trips that become', 'Viajes que se vuelven');
add('histórias', 'stories', 'historias');
add('pra sempre.', 'forever.', 'para siempre.');
add('VER TODAS AS JORNADAS', 'SEE ALL JOURNEYS', 'VER TODAS LAS JORNADAS');
add('MAIS ESCOLHIDA', 'MOST CHOSEN', 'MÁS ELEGIDA');
add('NOVIDADE', 'NEW', 'NOVIDAD');
add('EXCLUSIVO', 'EXCLUSIVE', 'EXCLUSIVO');
add('GRUPOS EXCLUSIVOS', 'EXCLUSIVE GROUPS', 'GRUPOS EXCLUSIVOS');
add('EXPERIÊNCIA IMERSIVA', 'IMMERSIVE EXPERIENCE', 'EXPERIENCIA INMERSIVA');
add('VIAGEM ÍNTIMA', 'INTIMATE TRIP', 'VIAJE ÍNTIMO');
add('15 DIAS', '15 DAYS', '15 DÍAS');
add('SEUL • BUSAN • JEJU', 'SEOUL • BUSAN • JEJU', 'SEÚL • BUSAN • JEJU');
add('Uma jornada feita para ARMYs que sonham em viver a Coreia de forma inesquecível.', 'A journey made for ARMYs who dream of living Korea unforgettably.', 'Una jornada hecha para ARMYs que sueñan con vivir Corea de forma inolvidable.');
add('A PARTIR DE', 'FROM', 'DESDE');
add('Jeju Edition', 'Jeju Edition', 'Edición Jeju');
add('16 DIAS', '16 DAYS', '16 DÍAS');
add('Natureza, cultura e momentos únicos na ilha mais encantadora da Coreia do Sul.', 'Nature, culture and unique moments on the most enchanting island of South Korea.', 'Naturaleza, cultura y momentos únicos en la isla más encantadora de Corea del Sur.');
add('da Primeira Neve', 'of the First Snow', 'de la Primera Nieve');
add('10 DIAS', '10 DAYS', '10 DÍAS');
add('Um roteiro exclusivo para viver o inverno coreano de forma mágica e acolhedora.', 'An exclusive itinerary to live the Korean winter magically and warmly.', 'Un itinerario exclusivo para vivir el invierno coreano de forma mágica y acogedora.');
add('PARCERIA OFICIAL', 'OFFICIAL PARTNERSHIP', 'ALIANZA OFICIAL');
add('A beleza da Coreia faz parte da sua jornada.', 'The beauty of Korea is part of your journey.', 'La belleza de Corea es parte de tu viaje.');
add('K-BEAUTY EXPERIENCE', 'K-BEAUTY EXPERIENCE', 'EXPERIENCIA K-BEAUTY');
add('Maeum Global × Cheotnun', 'Maeum Global × Cheotnun', 'Maeum Global × Cheotnun');
add('EXPERIÊNCIAS K-BEAUTY', 'K-BEAUTY EXPERIENCES', 'EXPERIENCIAS K-BEAUTY');
add('Tratamentos, workshops e vivências cuidadosamente selecionadas.', 'Carefully selected treatments, workshops and encounters.', 'Tratamientos, talleres y vivencias cuidadosamente seleccionadas.');
add('ACESSO EXCLUSIVO', 'EXCLUSIVE ACCESS', 'ACCESO EXCLUSIVO');
add('Clínicas e profissionais de excelência com acesso privilegiado.', 'Clinics and excellent professionals with privileged access.', 'Clínicas y profesionales de excelencia con acceso privilegiado.');
add('CURADORIA PREMIUM', 'PREMIUM CURATION', 'CURADURÍA PREMIUM');
add('Cada experiência é escolhida para representar o melhor da beleza coreana.', 'Each experience is chosen to represent the best of Korean beauty.', 'Cada experiencia se elige para representar lo mejor de la belleza coreana.');
add('BELEZA & CULTURA', 'BEAUTY & CULTURE', 'BELLEZA & CULTURA');
add('Bem-estar que conecta corpo, mente e tradição coreana.', 'Wellness that connects body, mind and Korean tradition.', 'Bienestar que conecta cuerpo, mente y tradición coreana.');
add('COREIA DO SUL', 'SOUTH KOREA', 'COREA DEL SUR');
add('PESSOA', 'PERSON', 'PERSONA');
add('Projeto ARMY 2027 Always Destination', 'ARMY Project 2027\nAlways Destination', 'Proyecto ARMY 2027\nAlways Destination');
add('Projeto ARMY 2027', 'ARMY Project 2027', 'Proyecto ARMY 2027');