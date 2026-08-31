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
// CONTATO
// ---------------------------------------------------------------------------
add('Consultoras Maeum Global Desktop', 'Maeum Global Consultants Desktop', 'Consultoras Maeum Global Escritorio');
add('Consultoras Maeum Global Mobile', 'Maeum Global Consultants Mobile', 'Consultoras Maeum Global Móvil');
add('ESTAMOS AQUI PARA VOCÊ', 'WE ARE HERE FOR YOU', 'ESTAMOS AQUÍ PARA TI');
add('Converse com', 'Talk to', 'Conversa con');
add('nossa equipe.', 'our team.', 'nuestro equipo.');
add('Seu sonho, nosso propósito.', 'Your dream, our purpose.', 'Tu sueño, nuestro propósito.');
add('Tire dúvidas, conheça melhor nossos pacotes, solicite seu planejamento ou apenas venha conversar. Nossa equipe está sempre pronta para te acolher e transformar sua viagem para a Coreia em realidade.', 'Ask questions, get to know our packages, request your itinerary or simply come and chat. Our team is always ready to welcome you and turn your trip to Korea into reality.', 'Resuelve dudas, conoce nuestros paquetes, solicita tu planificación o simplemente ven a conversar. Nuestro equipo siempre está listo para acogerte y hacer realidad tu viaje a Corea.');
add('INICIAR CONVERSA AGORA', 'START A CHAT NOW', 'INICIAR CONVERSACIÓN AHORA');
add('SOLICITAR PLANEJAMENTO', 'REQUEST A PLAN', 'SOLICITAR PLANIFICACIÓN');
add('ATENDIMENTO', 'SUPPORT', 'ATENCIÓN');
add('EM PORTUGUÊS', 'IN PORTUGUESE', 'EN PORTUGUÉS');
add('Equipe brasileira na Coreia e no Brasil.', 'Brazilian team in Korea and Brazil.', 'Equipo brasileño en Corea y en Brasil.');
add('RESPOSTA', 'RESPONSE', 'RESPUESTA');
add('RÁPIDA', 'QUICK', 'RÁPIDA');
add('Agilidade para tornar seus planos realidade.', 'Agility to turn your plans into reality.', 'Agilidad para hacer realidad tus planes.');
add('SEGURANÇA', 'SAFETY', 'SEGURIDAD');
add('Suporte completo antes, durante e após sua viagem.', 'Full support before, during and after your trip.', 'Soporte completo antes, durante y después de tu viaje.');
add('CONSULTORAS', 'CONSULTANTS', 'CONSULTORAS');
add('ESPECIALIZADAS', 'SPECIALIZED', 'ESPECIALIZADAS');
add('Consultoras apaixonadas pela Coreia.', 'Consultants passionate about Korea.', 'Consultoras apasionadas por Corea.');
add('HUMANO', 'HUMAN', 'HUMANO');
add('Conversas reais para decisões seguras.', 'Real conversations for safe decisions.', 'Conversaciones reales para decisiones seguras.');
add('ESCOLHA COMO VOCÊ PREFERE FALAR COM A GENTE', 'CHOOSE HOW YOU PREFER TO TALK TO US', 'ELIGE CÓMO PREFIERES HABLAR CON NOSOTROS');
add('OUTROS CANAIS', 'OTHER CHANNELS', 'OTROS CANALES');
add('Conecte-se com a Maeum Global pelo canal que você preferir.', 'Connect with Maeum Global through the channel you prefer.', 'Conéctate con Maeum Global por el canal que prefieras.');
add('WhatsApp', 'WhatsApp', 'WhatsApp');
add('Fale conosco de forma rápida e prática.', 'Talk to us quickly and easily.', 'Habla con nosotros de forma rápida y práctica.');
add('E-mail', 'E-mail', 'Correo electrónico');
add('Instagram', 'Instagram', 'Instagram');
add('Acompanhe e converse pelas redes.', 'Follow and chat through social media.', 'Síguenos y conversa por las redes.');
add('Telefone', 'Phone', 'Teléfono');
add('Segunda a Sexta • 09h às 18h', 'Monday to Friday • 9am to 6pm', 'Lunes a Viernes • 09h a 18h');
add('Localização', 'Location', 'Ubicación');
add('Seoul, Coreia do Sul', 'Seoul, South Korea', 'Seúl, Corea del Sur');
add('Atendimento online para todo o Brasil.', 'Online support for all of Brazil.', 'Atención online para todo Brasil.');
add('ANTES DE VIAJAR, VOCÊ TEM NOSSA EQUIPE', 'BEFORE YOU TRAVEL, YOU HAVE OUR TEAM', 'ANTES DE VIAJAR, TIENES NUESTRO EQUIPO');
add('REUNIÃO PRÉ-EMBARQUE', 'PRE-DEPARTURE MEETING', 'REUNIÓN PREVIA AL VIAJE');
add('Orientações completas antes da sua viagem.', 'Complete guidance before your trip.', 'Orientaciones completas antes de tu viaje.');
add('SUPORTE DURANTE A VIAGEM', 'SUPPORT DURING THE TRIP', 'SOPORTE DURANTE EL VIAJE');
add('Estaremos com você em todas as etapas.', 'We will be with you at every stage.', 'Estaremos contigo en todas las etapas.');
add('GRUPO EXCLUSIVO', 'EXCLUSIVE GROUP', 'GRUPO EXCLUSIVO');
add('Conecte-se com outros viajantes Maeum.', 'Connect with other Maeum travelers.', 'Conéctate con otros viajeros Maeum.');
add('MEMÓRIAS PARA SEMPRE', 'MEMORIES FOR LIFE', 'RECUERDOS PARA SIEMPRE');
add('Viva experiências que ficam para a vida toda.', 'Live experiences that last a lifetime.', 'Vive experiencias que duran toda la vida.');
add('AQUILO QUE VOCÊ PROCURA NÃO ESTÁ AQUI?', 'CAN\'T FIND WHAT YOU\'RE LOOKING FOR?', '¿NO ENCUENTRAS LO QUE BUSCAS?');
add('Fale com nossa equipe e criaremos um roteiro personalizado para você.', 'Talk to our team and we will create a personalized itinerary for you.', 'Habla con nuestro equipo y crearemos un itinerario personalizado para ti.');
add('SOLICITAR PLANEJAMENTO PERSONALIZADO', 'REQUEST A PERSONALIZED PLAN', 'SOLICITAR PLANIFICACIÓN PERSONALIZADA');
