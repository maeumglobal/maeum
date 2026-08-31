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
// TripPlanner
// ---------------------------------------------------------------------------
add('TIPO DE VIAGEM', 'TRIP TYPE', 'TIPO DE VIAJE');
add('Ida e Volta', 'Round Trip', 'Ida y Vuelta');
add('Só Ida', 'One Way', 'Solo Ida');
add('QUANTAS PESSOAS?', 'HOW MANY PEOPLE?', '¿CUÁNTAS PERSONAS?');
add('viajante', 'traveler', 'viajero');
add('viajantes', 'travelers', 'viajeros');
add('DATA DE IDA', 'DEPARTURE DATE', 'FECHA DE IDA');
add('DATA DE VOLTA', 'RETURN DATE', 'FECHA DE VUELTA');
add('Selecionar data', 'Select date', 'Seleccionar fecha');
add('Escolha a ida primeiro', 'Choose the departure first', 'Elige primero la ida');
add('Selecione a data de ida', 'Select the departure date', 'Selecciona la fecha de ida');
add('Selecione a data de volta', 'Select the return date', 'Selecciona la fecha de vuelta');
add('ORÇAMENTO POR PESSOA', 'BUDGET PER PERSON', 'PRESUPUESTO POR PERSONA');
add('opcional', 'optional', 'opcional');
add('Selecione seu orçamento', 'Select your budget', 'Selecciona tu presupuesto');
add('O QUE VOCÊ PROCURA?', 'WHAT ARE YOU LOOKING FOR?', '¿QUÉ ESTÁS BUSCANDO?');
add('SEU CONTATO PARA RECEBER O PLANEJAMENTO', 'YOUR CONTACT TO RECEIVE THE PLAN', 'TU CONTACTO PARA RECIBIR EL PLAN');
add('Seu nome', 'Your name', 'Tu nombre');
add('Seu e-mail', 'Your email', 'Tu correo');
add('WhatsApp (opcional)', 'WhatsApp (optional)', 'WhatsApp (opcional)');
add('ALGO IMPORTANTE QUE DEVEMOS SABER?', 'ANYTHING IMPORTANT WE SHOULD KNOW?', '¿ALGO IMPORTANTE QUE DEBAMOS SABER?');
add('Ex: lua de mel, aniversário, interesses específicos...', 'Ex: honeymoon, birthday, specific interests...', 'Ej: luna de miel, cumpleaños, intereses específicos...');
add('Enviando...', 'Sending...', 'Enviando...');
add('SOLICITAR ORÇAMENTO', 'REQUEST A QUOTE', 'SOLICITAR PRESUPUESTO');
add('Selecione a data de ida.', 'Select the departure date.', 'Selecciona la fecha de ida.');
add('Selecione a data de volta.', 'Select the return date.', 'Selecciona la fecha de vuelta.');
add('Erro ao enviar. Tente novamente.', 'Error sending. Please try again.', 'Error al enviar. Inténtalo de nuevo.');
add('Planejamento recebido!', 'Planning received!', '¡Planificación recibida!');
add('Uma consultora Maeum vai entrar em contato com você em breve para personalizar sua viagem.', 'A Maeum consultant will contact you soon to personalize your trip.', 'Una consultora Maeum se pondrá en contacto contigo pronto para personalizar tu viaje.');
add('Enviar outra solicitação', 'Send another request', 'Enviar otra solicitud');

// ---------------------------------------------------------------------------
// CookieBanner
// ---------------------------------------------------------------------------
add('Privacidade e Cookies', 'Privacy and Cookies', 'Privacidad y Cookies');
add('Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.', 'We use essential cookies for the site to work and analytical cookies to improve your experience.', 'Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar tu experiencia.');
add('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad');
add('Rejeitar', 'Reject', 'Rechazar');
add('Aceitar Todos', 'Accept All', 'Aceptar Todo');
add('Fechar', 'Close', 'Cerrar');

// ---------------------------------------------------------------------------
// AuthModal
// ---------------------------------------------------------------------------
add('Entrar na Conta', 'Sign In to Your Account', 'Iniciar Sesión en tu Cuenta');
add('Criar Nova Conta', 'Create New Account', 'Crear Nueva Cuenta');
add('Recuperar Senha', 'Recover Password', 'Recuperar Contraseña');
add('Login', 'Login', 'Iniciar Sesión');
add('Cadastrar', 'Register', 'Registrarse');
add('Nome Completo', 'Full Name', 'Nombre Completo');
add('Seu Nome Completo', 'Your Full Name', 'Tu Nombre Completo');
add('E-mail', 'Email', 'Correo');
add('Senha', 'Password', 'Contraseña');
add('Esqueceu sua senha?', 'Forgot your password?', '¿Olvidaste tu contraseña?');
add('ENTRAR', 'SIGN IN', 'INICIAR SESIÓN');
add('CRIAR CONTA', 'CREATE ACCOUNT', 'CREAR CUENTA');
add('ENVIAR EMAIL', 'SEND EMAIL', 'ENVIAR CORREO');
add('Processando...', 'Processing...', 'Procesando...');
add('Ou continuar com', 'Or continue with', 'O continuar con');
add('Continuar com Google', 'Continue with Google', 'Continuar con Google');
add('Voltar para o login', 'Back to login', 'Volver al inicio de sesión');
add('Conexão com Google autorizada!', 'Google connection authorized!', '¡Conexión con Google autorizada!');
add('Erro na autenticação com Google', 'Error authenticating with Google', 'Error de autenticación con Google');
add('Sessão iniciada com sucesso!', 'Session started successfully!', '¡Sesión iniciada con éxito!');
add('O nome é obrigatório.', 'The name is required.', 'El nombre es obligatorio.');
add('Cadastro realizado com sucesso!', 'Registration completed successfully!', '¡Registro realizado con éxito!');
add('Link de recuperação enviado para o seu e-mail!', 'Recovery link sent to your email!', '¡Enlace de recuperación enviado a tu correo!');
add('Erro ao processar requisição.', 'Error processing request.', 'Error al procesar la solicitud.');

// ---------------------------------------------------------------------------
// ClientChatWidget
// ---------------------------------------------------------------------------
add('CHAT COM', 'CHAT WITH', 'CHAT CON');
add('CHAT COM NOSSAS CONSULTORAS', 'CHAT WITH OUR CONSULTANTS', 'CHAT CON NUESTRAS CONSULTORAS');
add('Online agora', 'Online now', 'En línea ahora');
add('Olá! Sou a', "Hi! I'm", '¡Hola! Soy la');
add('Consultora', 'Consultant', 'Consultora');
add('Para iniciarmos nosso atendimento, por favor, me diga seu nome e e-mail.', 'To get started, please tell me your name and email.', 'Para iniciar nuestra atención, por favor dime tu nombre y correo.');
add('Seu Nome', 'Your Name', 'Tu Nombre');
add('Conectando...', 'Connecting...', 'Conectando...');
add('Começar a Conversar', 'Start Chatting', 'Empezar a Conversar');
add('Digite sua mensagem...', 'Type your message...', 'Escribe tu mensaje...');
add('Erro ao iniciar chat.', 'Error starting chat.', 'Error al iniciar el chat.');
add('Olá, meu nome é', 'Hi, my name is', 'Hola, mi nombre es');
add('Gostaria de iniciar um atendimento!', 'I would like to start a conversation!', '¡Me gustaría iniciar una atención!');

// ---------------------------------------------------------------------------
// PublicProposalPage
// ---------------------------------------------------------------------------
add('Proposta não encontrada', 'Proposal not found', 'Propuesta no encontrada');
add('O link pode ter expirado ou está incorreto.', 'The link may have expired or is incorrect.', 'El enlace puede haber expirado o ser incorrecto.');
add('Orçamento Exclusivo', 'Exclusive Quote', 'Presupuesto Exclusivo');
add('Versão', 'Version', 'Versión');
add('Atualizado em', 'Updated on', 'Actualizado el');
add('Aprovada', 'Approved', 'Aprobada');
add('Revisão Solicitada', 'Changes Requested', 'Revisión Solicitada');
add('Aguardando Aprovação', 'Pending Approval', 'Pendiente de Aprobación');
add('Itens Selecionados no Itinerário', 'Selected Itinerary Items', 'Elementos Seleccionados del Itinerario');
add('Serviço personalizado de turismo de luxo.', 'Custom luxury travel service.', 'Servicio personalizado de turismo de lujo.');
add('Total do Orçamento', 'Budget Total', 'Total del Presupuesto');
add('Aprovar Proposta', 'Approve Proposal', 'Aprobar Propuesta');
add('Ajustes', 'Adjustments', 'Ajustes');
add('Ex: Gostaria de alterar a categoria do hotel ou incluir transfer privativo...', 'Ex: I would like to change the hotel category or include a private transfer...', 'Ej: Me gustaría cambiar la categoría del hotel o incluir transfer privado...');
add('Cancelar', 'Cancel', 'Cancelar');
add('Enviar Solicitação', 'Send Request', 'Enviar Solicitud');
add('Aprovado pelo link compartilhado', 'Approved via the shared link', 'Aprobado a través del enlace compartido');
add('Solicitação de alteração enviada.', 'Change request sent.', 'Solicitud de cambio enviada.');
add('US$', 'US$', 'US$');
add('¿Qué cambios o ajustes te gustaría solicitar?', 'What changes or adjustments would you like to request?', '¿Qué cambios o ajustes te gustaría solicitar?');
pt['¿Qué cambios o ajustes te gustaría solicitar?'] = 'Que mudanças ou ajustes você gostaria de solicitar?';
add('¡Proposta Aprovada com sucesso!', 'Proposal approved successfully!', '¡Propuesta aprobada con éxito!');
pt['¡Proposta Aprovada com sucesso!'] = 'Proposta aprovada com sucesso!';
