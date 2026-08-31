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
// PÁGINAS DE DETALHE ([slug])
// ---------------------------------------------------------------------------

// Experiência (coreia-do-sul/experiencias/[slug])
add('Agência de Viagens Coreia do Sul Maeum Global Experiência Detalhe', 'South Korea Travel Agency Maeum Global Experience Detail', 'Agencia de Viajes Corea del Sur Maeum Global Detalle de Experiencia');
add('Experiência não encontrada', 'Experience not found', 'Experiencia no encontrada');
add('Voltar para Experiências', 'Back to Experiences', 'Volver a Experiencias');
add('Compartilhar', 'Share', 'Compartir');
add('Sobre esta experiência', 'About this experience', 'Sobre esta experiencia');
add('O que você vai viver', 'What you will experience', 'Lo que vas a vivir');
add('O que está incluso', 'What is included', 'Qué está incluido');
add('Localização', 'Location', 'Ubicación');
add('Informações importantes', 'Important information', 'Información importante');
add('Reserva direta disponível — garanta sua vaga agora mesmo.', 'Direct booking available — secure your spot now.', 'Reserva directa disponible: asegura tu lugar ahora mismo.');
add('Esta experiência requer solicitação de reserva. Nossa equipe entrará em contato para confirmar disponibilidade.', 'This experience requires a booking request. Our team will contact you to confirm availability.', 'Esta experiencia requiere solicitud de reserva. Nuestro equipo te contactará para confirmar disponibilidad.');
add('Viva essa experiência comigo', 'Live this experience with me', 'Vive esta experiencia conmigo');
add('Experiência em vídeo', 'Experience video', 'Experiencia en video');
add('Em breve: vídeo exclusivo desta experiência', 'Coming soon: exclusive video of this experience', 'Próximamente: video exclusivo de esta experiencia');
add('participantes', 'participants', 'participantes');
add('pessoa', 'person', 'persona');
add('pessoas', 'people', 'personas');
add('Você não será cobrado(a) agora. A confirmação será enviada por e-mail.', 'You will not be charged now. Confirmation will be sent by e-mail.', 'No se te cobrará ahora. La confirmación se enviará por correo electrónico.');
add('Após solicitar, nossa equipe verificará a disponibilidade e retornará em até 24h.', 'After requesting, our team will check availability and get back to you within 24h.', 'Después de tu solicitud, nuestro equipo verificará la disponibilidad y te responderá en un máximo de 24h.');
add('Reservar', 'Book now', 'Reservar');
add('Solicitar', 'Request', 'Solicitar');

// slug: página de detalhe (coreia-do-sul/jornadas/[slug])
add('Jornada não encontrada', 'Journey not found', 'Jornada no encontrada');
add('Voltar para Jornadas', 'Back to Journeys', 'Volver a Jornadas');
add('Dias', 'days', 'días');
add('Conceito da Viagem', 'Journey Concept', 'Concepto del Viaje');
add('Datas e Saídas', 'Dates & Departures', 'Fechas y Salidas');
add('Data Inicial', 'Start Date', 'Fecha Inicial');
add('Data Final', 'End Date', 'Fecha Final');
add('Vagas Totais', 'Total Spots', 'Vacantes Totales');
add('Vagas Disponíveis', 'Available Spots', 'Vacantes Disponibles');
add('Status', 'Status', 'Estado');
add('Observações', 'Notes', 'Observaciones');
add('Disponível', 'Available', 'Disponible');
add('Esgotada', 'Sold out', 'Agotada');
add('Destaques da Jornada', 'Journey Highlights', 'Destacados de la Jornada');
add('Roteiro', 'Itinerary', 'Itinerario');
add('Inclusões', 'Included', 'Incluye');
add('Não Inclusões', 'Not Included', 'No Incluye');
add('Categorias da Caravana', 'Caravan Categories', 'Categorías de la Caravana');
add('Galeria', 'Gallery', 'Galería');
add('Vídeo', 'Video', 'Vídeo');
add('Jornada em vídeo', 'Journey video', 'Jornada en video');
add('Em breve: vídeo exclusivo desta jornada', 'Coming soon: exclusive video of this journey', 'Próximamente: video exclusivo de esta jornada');
add('Categoria', 'Category', 'Categoría');
add('Economize R$', 'Save $', 'Ahorra R$');
add('com a categoria', 'with the', 'con la categoría');
add('Upgrade para', 'Upgrade to', 'Mejora a');
add('por apenas', 'for just', 'por solo');
add('a mais', 'more', 'más');
add('Próxima saída disponível', 'Next available departure', 'Próxima salida disponible');
add('vagas restantes', 'spots remaining', 'vacantes restantes');
add('SOLICITAR RESERVA', 'REQUEST BOOKING', 'SOLICITAR RESERVA');
add('Aceitamos Pix, boleto em até 48x e cartão em até 24x sem juros', 'We accept Pix, bank slip up to 48x and credit card up to 24x interest-free', 'Aceptamos Pix, boleto hasta 48x y tarjeta hasta 24x sin intereses');
add('Entre 25 e 48 vezes possuem acréscimo simples de 5%', 'Between 25 and 48 installments there is a simple 5% surcharge', 'Entre 25 y 48 cuotas hay un recargo simple del 5%');
add('/ pessoa', '/ person', '/ persona');

// Destino (destinos/[slug])
add('Destino não encontrado', 'Destination not found', 'Destino no encontrado');
add('Voltar para Destinos', 'Back to Destinations', 'Volver a Destinos');
add('Destino Premium', 'Premium Destination', 'Destino Premium');
add('Sobre o destino', 'About the destination', 'Sobre el destino');
add('Galeria de Experiências', 'Gallery of Experiences', 'Galería de Experiencias');
add('Explorar Coreia do Sul', 'Explore South Korea', 'Explorar Corea del Sur');
add('Experiências', 'Experiences', 'Experiencias');
add('Explore experiências individuais', 'Explore individual experiences', 'Explora experiencias individuales');
add('K-Beauty', 'K-Beauty', 'K-Beauty');
add('Beleza e cuidados coreanos', 'Korean beauty and care', 'Belleza y cuidados coreanos');
add('Intercâmbio', 'Exchange', 'Intercambio');
add('Lexis Korea — programas de coreano', 'Lexis Korea — Korean programs', 'Lexis Korea — programas de coreano');
add('Jornadas', 'Journeys', 'Jornadas');
add('Viagens em grupo exclusivas', 'Exclusive group trips', 'Viajes en grupo exclusivos');
add('Informação de Viagem', 'Travel Information', 'Información de Viaje');
add('País:', 'Country:', 'País:');
add('Coordenadas:', 'Coordinates:', 'Coordenadas:');
add('Temporada ideal:', 'Ideal season:', 'Temporada ideal:');
add('Todo o ano', 'All year round', 'Todo el año');
add('Idioma local:', 'Local language:', 'Idioma local:');
add('Nativo / Inglês', 'Native / English', 'Nativo / Inglés');
add('Ver Vídeo Destacado', 'Watch Featured Video', 'Ver Video Destacado');
add('EXPLORAR COREIA DO SUL', 'EXPLOR SOUTH KOREA', 'EXPLORAR COREA DEL SUR');
add('Programas e Viagens Disponíveis', 'Programs and Trips Available', 'Programas y Viajes Disponibles');
add('VER ROTEIRO DETALHADO', 'VIEW DETAILED ITINERARY', 'VER ITINERARIO DETALLADO');
add('Em breve, adicionaremos saídas para este destino.', 'We will soon add departures for this destination.', 'Próximamente agregaremos salidas para este destino.');

// Pacote (pacotes/[slug])
add('Pacote não encontrado', 'Package not found', 'Paquete no encontrado');
add('Voltar para Pacotes', 'Back to Packages', 'Volver a los Paquetes');
add('Voltar para todos os pacotes', 'Back to all packages', 'Volver a todos los paquetes');
add('Viagem Exclusiva', 'Exclusive Trip', 'Viaje Exclusivo');
add('10 Dias', '10 Days', '10 Días');
add('Roteiro Dia a Dia', 'Day by Day Itinerary', 'Itinerario Día a Día');
add('Dia', 'Day', 'Día');
add('O que está incluso', 'What is included', 'Qué está incluido');
add('O que não está incluso', 'What is not included', 'Qué no está incluido');
add('Investimento do Viajante', 'Trip Investment', 'Inversión del Viaje');
add('/ por pessoa', '/ per person', '/ por persona');
add('Duração:', 'Duration:', 'Duración:');
add('Próximas saídas:', 'Upcoming departures:', 'Próximas salidas:');
add('A definir', 'To be defined', 'Por definir');
add('Solicitar Orçamento', 'Request a Quote', 'Solicitar Presupuesto');
add('✓ Solicitação recebida! Entraremos em contato em breve.', '✓ Request received! We will contact you shortly.', '✓ ¡Solicitud recibida! Te contactaremos en breve.');
add('Nome Completo', 'Full Name', 'Nombre Completo');
add('E-mail de contato', 'Contact e-mail', 'E-mail de contacto');
add('Telefone (WhatsApp)', 'Phone (WhatsApp)', 'Teléfono (WhatsApp)');
add('Enviando...', 'Sending...', 'Enviando...');
add('Enviar Solicitação', 'Send Request', 'ENVIAR SOLICITUD');
add('Ou converse diretamente pelo', 'Or chat directly via', 'O conversa directamente por');
add('WhatsApp Directo', 'WhatsApp Direct', 'WhatsApp Directo');
add('Olá, gostaria de saber mais sobre o pacote ', 'Hello, I would like to know more about the package ', 'Hola, me gustaría saber más sobre el paquete ');
add('Formulário Pacote: ', 'Package Form: ', 'Formulario Paquete: ');