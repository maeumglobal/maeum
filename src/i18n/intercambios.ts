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
// INTERCÂMBIOS (index)
// ---------------------------------------------------------------------------
add('Imersão de Prestígio', 'Prestige Immersion', 'Inmersión de Prestigio');
add('Programas de Intercâmbio', 'Exchange Programs', 'Programas de Intercambio');
add('Estude nas melhores universidades da Ásia com suporte completo da Maeum Global. Cuidamos de todo o processo de visto, matrícula, hospedagem executiva e acolhimento local.', 'Study at Asia\'s best universities with full support from Maeum Global. We handle the entire visa, enrollment, executive accommodation and local reception process.', 'Estudia en las mejores universidades de Asia con soporte completo de Maeum Global. Nos encargamos de todo el proceso de visa, matrícula, alojamiento ejecutivo y recepción local.');
add('Intercâmbio de Idiomas & Cultura em Seul', 'Language & Culture Exchange in Seoul', 'Intercambio de Idiomas & Cultura en Seúl');
add('4 a 12 semanas', '4 to 12 weeks', '4 a 12 semanas');
add('Aprenda coreano no coração de Seul, com hospedagem em estúdio de luxo e atividades culturais inclusas (culinária, caligrafia e K-Pop).', 'Learn Korean in the heart of Seoul, with luxury studio accommodation and cultural activities included (cooking, calligraphy and K-Pop).', 'Aprende coreano en el corazón de Seúl, con alojamiento en estudio de lujo y actividades culturales incluidas (cocina, caligrafía y K-Pop).');
add('A partir de US$ 2,800', 'From US$ 2,800', 'Desde US$ 2,800');
add('Semestre Acadêmico em Tóquio', 'Academic Semester in Tokyo', 'Semestre Académico en Tokio');
add('6 meses', '6 months', '6 meses');
add('Imersão completa no ambiente acadêmico japonês com aulas de negócios e cultura. Acomodação premium em Shinjuku.', 'Complete immersion in the Japanese academic environment with business and culture classes. Premium accommodation in Shinjuku.', 'Inmersión completa en el ambiente académico japonés con clases de negocios y cultura. Alojamiento premium en Shinjuku.');
add('A partir de US$ 5,900', 'From US$ 5,900', 'Desde US$ 5,900');

// ---------------------------------------------------------------------------
// INTERCÂMBIO (coreia-do-sul/intercambio)
// ---------------------------------------------------------------------------
add('Carregando...', 'Loading...', 'Cargando...');
add('Intercâmbio na Coreia do Sul Maeum Global Desktop', 'Exchange in South Korea Maeum Global Desktop', 'Intercambio en Corea del Sur Maeum Global Desktop');
add('Intercâmbio na Coreia do Sul Maeum Global Mobile', 'Exchange in South Korea Maeum Global Mobile', 'Intercambio en Corea del Sur Maeum Global Mobile');
add('Intercâmbio Premium', 'Premium Exchange', 'Intercambio Premium');
add('Intercâmbio na Coreia do Sul', 'Exchange in South Korea', 'Intercambio en Corea del Sur');
add('Estude coreano na Lexis Korea, escola parceira com unidades em Gangnam, Hongdae e Busan. Uma experiência imersiva que combina aprendizado de alto nível com a descoberta da cultura coreana.', 'Study Korean at Lexis Korea, a partner school with locations in Gangnam, Hongdae and Busan. An immersive experience that combines high-level learning with the discovery of Korean culture.', 'Estudia coreano en Lexis Korea, escuela socia con sedes en Gangnam, Hongdae y Busan. Una experiencia inmersiva que combina aprendizaje de alto nivel con el descubrimiento de la cultura coreana.');
add('Sua jornada de aprendizado começa aqui', 'Your learning journey starts here', 'Tu viaje de aprendizaje comienza aquí');
add('Escola de idiomas premium na Coreia do Sul, com campi em Gangnam, Hongdae e Busan. Reconhecida pela excelência no ensino de coreano para estrangeiros.', 'Premium language school in South Korea, with campuses in Gangnam, Hongdae and Busan. Recognized for excellence in teaching Korean to foreigners.', 'Escuela de idiomas premium en Corea del Sur, con campus en Gangnam, Hongdae y Busan. Reconocida por su excelencia en la enseñanza del coreano a extranjeros.');
add('20 aulas/semana (Intensivo) | 15 aulas/semana (Standard)', '20 classes/week (Intensive) | 15 classes/week (Standard)', '20 clases/semana (Intensivo) | 15 clases/semana (Standard)');
add('3 campi: Seul (2) & Busan', '3 campuses: Seoul (2) & Busan', '3 campus: Seúl (2) y Busan');
add('Campi', 'Campuses', 'Campus');
add('Semanas máx.', 'Max. weeks', 'Semanas máx.');
add('Semanas', 'Weeks', 'Semanas');
add('Programas', 'Programs', 'Programas');
add('Suporte Maeum', 'Maeum Support', 'Soporte Maeum');
add('Nossos Campi', 'Our Campuses', 'Nuestros Campus');
add('Escolha onde estudar', 'Choose where to study', 'Elige dónde estudiar');
add('Programas disponíveis', 'Available programs', 'Programas disponibles');
add('Escolha seu curso de coreano', 'Choose your Korean course', 'Elige tu curso de coreano');
add('aulas/semana', 'classes/week', 'clases/semana');
add('Duração', 'Duration', 'Duración');
add('a', 'to', 'a');
add('semanas', 'weeks', 'semanas');
add('semana', 'week', 'semana');
add('Atividades Culturais Inclusas', 'Cultural Activities Included', 'Actividades Culturales Incluidas');
add('O programa inclui atividades culturais regulares como caligrafia coreana, culinária, K-Pop e visitas a pontos turísticos, proporcionando uma imersão completa na cultura coreana.', 'The program includes regular cultural activities such as Korean calligraphy, cooking, K-Pop and visits to tourist attractions, providing a complete immersion in Korean culture.', 'El programa incluye actividades culturales regulares como caligrafía coreana, cocina, K-Pop y visitas a lugares turísticos, brindando una inmersión completa en la cultura coreana.');
add('Tabela de Preços', 'Price Table', 'Tabla de Precios');
add('Preço por semana', 'Price per week', 'Precio por semana');
add('Taxa de Matrícula', 'Enrollment Fee', 'Tarifa de Matrícula');
add('Material Didático', 'Course Material', 'Material Didáctico');
add('Atividades culturais inclusas', 'Cultural activities included', 'Actividades culturales incluidas');
add('Planeje seu intercâmbio', 'Plan your exchange', 'Planifica tu intercambio');
add('Solicitar Planejamento', 'Request Planning', 'Solicitar Planificación');
add('Preencha o formulário ao lado com suas preferências. Nossa equipe preparará um planejamento personalizado com orçamento detalhado, sugestão de hospedagem e todo o suporte necessário para sua jornada de estudos na Coreia do Sul.', 'Fill in the form beside you with your preferences. Our team will prepare a personalized plan with a detailed budget, accommodation suggestions and all the support you need for your study journey in South Korea.', 'Completa el formulario a un lado con tus preferencias. Nuestro equipo preparará una planificación personalizada con presupuesto detallado, sugerencia de alojamiento y todo el soporte necesario para tu viaje de estudios en Corea del Sur.');
add('Orientação personalizada gratuita', 'Free personalized guidance', 'Orientación personalizada gratuita');
add('Suporte em português do início ao fim', 'Support in Portuguese from start to finish', 'Soporte en portugués de principio a fin');
add('Auxílio com matrícula, visto e hospedagem', 'Help with enrollment, visa and accommodation', 'Ayuda con matrícula, visa y alojamiento');
add('Solicitação Enviada!', 'Request Sent!', 'Solicitud Enviada!');
add('Recebemos seus dados e em breve nossa equipe entrará em contato com um planejamento personalizado para seu intercâmbio na Coreia do Sul.', 'We received your data and soon our team will contact you with a personalized plan for your exchange in South Korea.', 'Recibimos tus datos y pronto nuestro equipo se pondrá en contacto contigo con una planificación personalizada para tu intercambio en Corea del Sur.');
add('Enviar Nova Solicitação', 'Send New Request', 'Enviar Nueva Solicitud');
add('Nome Completo *', 'Full Name *', 'Nombre Completo *');
add('Seu nome completo', 'Your full name', 'Tu nombre completo');
add('País de Residência', 'Country of Residence', 'País de Residencia');
add('Brasil', 'Brazil', 'Brasil');
add('Idioma de Atendimento', 'Service Language', 'Idioma de Atención');
add('Idade', 'Age', 'Edad');
add('Sua idade', 'Your age', 'Tu edad');
add('Nível Atual de Coreano', 'Current Korean Level', 'Nivel Actual de Coreano');
add('Iniciante', 'Beginner', 'Principiante');
add('Básico', 'Basic', 'Básico');
add('Intermediário', 'Intermediate', 'Intermedio');
add('Avançado', 'Advanced', 'Avanzado');
add('Fluente', 'Fluent', 'Fluido');
add('Campus de Interesse', 'Campus of Interest', 'Campus de Interés');
add('Selecione um campus', 'Select a campus', 'Selecciona un campus');
add('Curso de Interesse', 'Course of Interest', 'Curso de Interés');
add('Selecione um curso', 'Select a course', 'Selecciona un curso');
add('Quantidade de Semanas', 'Number of Weeks', 'Cantidad de Semanas');
add('Ex: 4', 'e.g. 4', 'Ej: 4');
add('Período Pretendido', 'Preferred Period', 'Período Previsto');
add('Ex: Janeiro 2027', 'e.g. January 2027', 'Ej: Enero 2027');
add('Interesse em hospedagem', 'Interested in accommodation', 'Interés en alojamiento');
add('Interesse em seguro viagem', 'Interested in travel insurance', 'Interés en seguro de viaje');
add('Interesse em transfer', 'Interested in transfer', 'Interés en transfer');
add('Observações', 'Notes', 'Observaciones');
add('Conte-nos mais sobre suas expectativas, necessidades especiais ou dúvidas...', 'Tell us more about your expectations, special needs or questions...', 'Cuéntanos más sobre tus expectativas, necesidades especiales o dudas...');
add('SOLICITAR PLANEJAMENTO', 'REQUEST PLANNING', 'SOLICITAR PLANIFICACIÓN');
add('Português', 'Portuguese', 'Portugués');
add('English', 'English', 'Inglés');
add('Español', 'Spanish', 'Español');
