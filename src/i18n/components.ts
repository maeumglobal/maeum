import { makeGroup } from './group';

const g = makeGroup('components');

// ---------------------------------------------------------------------------
// TripPlanner
// ---------------------------------------------------------------------------
g('tripPlanner.tripType', 'TIPO DE VIAGEM', 'TRIP TYPE', 'TIPO DE VIAJE');
g('ida-e-volta', 'Ida e Volta', 'Round Trip', 'Ida y Vuelta');
g('so-ida', 'Só Ida', 'One Way', 'Solo Ida');
g('tripPlanner.howManyPeople', 'QUANTAS PESSOAS?', 'HOW MANY PEOPLE?', '¿CUÁNTAS PERSONAS?');
g('tripPlanner.traveler', 'viajante', 'traveler', 'viajero');
g('tripPlanner.travelers', 'viajantes', 'travelers', 'viajeros');
g('data-de-ida', 'DATA DE IDA', 'DEPARTURE DATE', 'FECHA DE IDA');
g('data-de-volta', 'DATA DE VOLTA', 'RETURN DATE', 'FECHA DE VUELTA');
g('selecionar-data', 'Selecionar data', 'Select date', 'Seleccionar fecha');
g('escolha-a-ida-primeiro', 'Escolha a ida primeiro', 'Choose the departure first', 'Elige primero la ida');
g('selecione-a-data-de-ida', 'Selecione a data de ida', 'Select the departure date', 'Selecciona la fecha de ida');
g('selecione-a-data-de-volta', 'Selecione a data de volta', 'Select the return date', 'Selecciona la fecha de vuelta');
g('orcamento-por-pessoa', 'ORÇAMENTO POR PESSOA', 'BUDGET PER PERSON', 'PRESUPUESTO POR PERSONA');
g('opcional', 'opcional', 'optional', 'opcional');
g('selecione-seu-orcamento', 'Selecione seu orçamento', 'Select your budget', 'Selecciona tu presupuesto');
g('o-que-voce-procura', 'O QUE VOCÊ PROCURA?', 'WHAT ARE YOU LOOKING FOR?', '¿QUÉ ESTÁS BUSCANDO?');
g('tripPlanner.contactKicker', 'SEU CONTATO PARA RECEBER O PLANEJAMENTO', 'YOUR CONTACT TO RECEIVE THE PLAN', 'TU CONTACTO PARA RECIBIR EL PLAN');
g('seu-nome', 'Seu nome', 'Your name', 'Tu nombre');
g('seu-e-mail', 'Seu e-mail', 'Your email', 'Tu correo');
g('whatsapp', 'WhatsApp (opcional)', 'WhatsApp (optional)', 'WhatsApp (opcional)');
g('algo-importante-que-devemos-saber', 'ALGO IMPORTANTE QUE DEVEMOS SABER?', 'ANYTHING IMPORTANT WE SHOULD KNOW?', '¿ALGO IMPORTANTE QUE DEBAMOS SABER?');
g('tripPlanner.notesPlaceholder', 'Ex: lua de mel, aniversário, interesses específicos...', 'Ex: honeymoon, birthday, specific interests...', 'Ej: luna de miel, cumpleaños, intereses específicos...');
g('enviando', 'Enviando...', 'Sending...', 'Enviando...');
g('solicitar-orcamento', 'SOLICITAR ORÇAMENTO', 'REQUEST A QUOTE', 'SOLICITAR PRESUPUESTO');
g('selecione-a-data-de-ida-x', 'Selecione a data de ida.', 'Select the departure date.', 'Selecciona la fecha de ida.');
g('selecione-a-data-de-volta-x', 'Selecione a data de volta.', 'Select the return date.', 'Selecciona la fecha de vuelta.');
g('erro-ao-enviar-tente-novamente', 'Erro ao enviar. Tente novamente.', 'Error sending. Please try again.', 'Error al enviar. Inténtalo de nuevo.');
g('planejamento-recebido', 'Planejamento recebido!', 'Planning received!', '¡Planificación recibida!');
g('tripPlanner.successDescription', 'Uma consultora Maeum vai entrar em contato com você em breve para personalizar sua viagem.', 'A Maeum consultant will contact you soon to personalize your trip.', 'Una consultora Maeum se pondrá en contacto contigo pronto para personalizar tu viaje.');
g('enviar-outra-solicitacao', 'Enviar outra solicitação', 'Send another request', 'Enviar otra solicitud');
g('tripPlanner.traveler-x', 'Viajante', 'Traveler', 'Viajero');
g('mes-anterior', 'Mês anterior', 'Previous month', 'Mes anterior');
g('proximo-mes', 'Próximo mês', 'Next month', 'Mes siguiente');
g('orcamento', 'Orçamento', 'Budget', 'Presupuesto');
// ---------------------------------------------------------------------------
// CookieBanner
// ---------------------------------------------------------------------------
g('privacidade-e-cookies', 'Privacidade e Cookies', 'Privacy and Cookies', 'Privacidad y Cookies');
g('cookieBanner.description', 'Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.', 'We use essential cookies for the site to work and analytical cookies to improve your experience.', 'Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar tu experiencia.');
g('politica-de-privacidade', 'Política de Privacidade', 'Privacy Policy', 'Política de Privacidad');
g('rejeitar', 'Rejeitar', 'Reject', 'Rechazar');
g('aceitar-todos', 'Aceitar Todos', 'Accept All', 'Aceptar Todo');
g('fechar', 'Fechar', 'Close', 'Cerrar');
g('banner-de-cookies', 'Banner de cookies', 'Cookie banner', 'Banner de cookies');
// ---------------------------------------------------------------------------
// AuthModal
// ---------------------------------------------------------------------------
g('entrar-na-conta', 'Entrar na Conta', 'Sign In to Your Account', 'Iniciar Sesión en tu Cuenta');
g('criar-nova-conta', 'Criar Nova Conta', 'Create New Account', 'Crear Nueva Cuenta');
g('recuperar-senha', 'Recuperar Senha', 'Recover Password', 'Recuperar Contraseña');
g('login', 'Login', 'Login', 'Iniciar Sesión');
g('cadastrar', 'Cadastrar', 'Sign Up', 'Registrarse');
g('nome-completo', 'Nome Completo', 'Full Name', 'Nombre Completo');
g('seu-nome-completo', 'Seu Nome Completo', 'Your Full Name', 'Tu Nombre Completo');
g('e-mail', 'E-mail', 'E-mail', 'Correo electrónico');
g('senha', 'Senha', 'Password', 'Contraseña');
g('esqueceu-sua-senha', 'Esqueceu sua senha?', 'Forgot your password?', '¿Olvidaste tu contraseña?');
g('entrar', 'ENTRAR', 'SIGN IN', 'INICIAR SESIÓN');
g('criar-conta', 'CRIAR CONTA', 'CREATE ACCOUNT', 'CREAR CUENTA');
g('enviar-email', 'ENVIAR EMAIL', 'SEND EMAIL', 'ENVIAR CORREO');
g('processando', 'Processando...', 'Processing...', 'Procesando...');
g('ou-continuar-com', 'Ou continuar com', 'Or continue with', 'O continuar con');
g('continuar-com-google', 'Continuar com Google', 'Continue with Google', 'Continuar con Google');
g('voltar-para-o-login', 'Voltar para o login', 'Back to login', 'Volver al inicio de sesión');
g('conexao-com-google-autorizada', 'Conexão com Google autorizada!', 'Google connection authorized!', '¡Conexión con Google autorizada!');
g('erro-na-autenticacao-com-google', 'Erro na autenticação com Google', 'Error authenticating with Google', 'Error de autenticación con Google');
g('sessao-iniciada-com-sucesso', 'Sessão iniciada com sucesso!', 'Session started successfully!', '¡Sesión iniciada con éxito!');
g('o-nome-e-obrigatorio', 'O nome é obrigatório.', 'The name is required.', 'El nombre es obligatorio.');
g('cadastro-realizado-com-sucesso', 'Cadastro realizado com sucesso!', 'Registration completed successfully!', '¡Registro realizado con éxito!');
g('link-de-recuperacao-enviado-para', 'Link de recuperação enviado para o seu e-mail!', 'Recovery link sent to your email!', '¡Enlace de recuperación enviado a tu correo!');
g('erro-ao-processar-requisicao', 'Erro ao processar requisição.', 'Error processing request.', 'Error al procesar la solicitud.');
// Autenticação (AuthModal / Login / AdminGuard) — chaves novas
g('maeum-portal', 'MAEUM PORTAL', 'MAEUM PORTAL', 'MAEUM PORTAL');
g('portal-de-acesso', 'Portal de Acesso', 'Access Portal', 'Portal de Acceso');
g('alterar-senha', 'Alterar Senha', 'Change Password', 'Cambiar Contraseña');
g('redefinir-senha', 'Redefinir Senha', 'Reset Password', 'Restablecer Contraseña');
g('alterar-minha-senha', 'Alterar minha senha', 'Change my password', 'Cambiar mi contraseña');
g('esqueci-minha-senha', 'Esqueci minha senha', 'Forgot my password', 'Olvidé mi contraseña');
g('nova-senha', 'Nova Senha', 'New Password', 'Nueva Contraseña');
g('senha-atual', 'Senha Atual', 'Current Password', 'Contraseña Actual');
g('confirmar-nova-senha', 'Confirmar Nova Senha', 'Confirm New Password', 'Confirmar Nueva Contraseña');
g('a-senhas-nao-coincidem', 'A Senhas Não Coincidem', 'Passwords do not match', 'Las Contraseñas No Coinciden');
g('indisponivel-neste-momento', 'Indisponível neste momento', 'Unavailable at this time', 'No disponible por el momento');
g('o-login-social-esta-indisponivel', 'O login social está indisponível por enquanto.', 'Social sign-in is unavailable for now.', 'El acceso social no está disponible por ahora.');
g('a-nova-senha-precisa-ter', 'A nova senha precisa ter ao menos 8 caracteres.', 'The new password must be at least 8 characters long.', 'La nueva contraseña debe tener al menos 8 caracteres.');
g('preencha-todos-os-campos-para', 'Preencha todos os campos para continuar.', 'Please fill in all fields to continue.', 'Completa todos los campos para continuar.');
g('falha-na-conexao-tente-novamente', 'Falha na conexão. Tente novamente.', 'Connection failed. Please try again.', 'Falló la conexión. Inténtalo de nuevo.');
g('sessao-encerrada-com-sucesso', 'Sessão encerrada com sucesso.', 'Signed out successfully.', 'Sesión cerrada correctamente.');
g('voltar-ao-portal', 'Voltar ao portal', 'Back to the portal', 'Volver al portal');
g('verificando-seguranca', 'Verificando segurança...', 'Verifying security...', 'Verificando seguridad...');
g('auth.noPermission', 'Você não tem permissão para acessar esta área.', 'You do not have permission to access this area.', 'No tienes permiso para acceder a esta área.');
g('protegendo-sua-conta', 'Protegendo sua conta...', 'Securing your account...', 'Protegiendo tu cuenta...');
g('acesse-seu-painel', 'Acesse seu painel', 'Access your dashboard', 'Accede a tu panel');
g('ainda-nao-tem-conta', 'Ainda não tem conta?', 'Don\'t have an account yet?', '¿Aún no tienes cuenta?');
g('criar-conta-x', 'Criar conta', 'Create account', 'Crear cuenta');
// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
g('menu', 'Menu', 'Menu', 'Menú');
g('abrir-menu', 'Abrir menu', 'Open menu', 'Abrir menú');
g('fechar-menu', 'Fechar menu', 'Close menu', 'Cerrar menú');
g('escolher-idioma', 'Escolher idioma', 'Choose language', 'Elegir idioma');
g('minha-conta', 'Minha conta', 'My account', 'Mi cuenta');
g('opcoes-da-conta', 'Opções da conta', 'Account options', 'Opciones de la cuenta');
g('logotipo-da-maeum-global', 'Logotipo da Maeum Global', 'Maeum Global logo', 'Logotipo de Maeum Global');
g('sessao-nome', 'Sessão: {nome}', 'Signed in as {nome}', 'Sesión: {nome}');
g('sair', 'Sair', 'Sign out', 'Salir');
g('painel', 'Painel', 'Dashboard', 'Panel');
// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
g('contato-rapido', 'Contato rápido', 'Quick contact', 'Contacto rápido');
g('endereco', 'Endereço', 'Address', 'Dirección');
g('instagram', 'Instagram', 'Instagram', 'Instagram');
g('youtube', 'YouTube', 'YouTube', 'YouTube');
g('pinterest', 'Pinterest', 'Pinterest', 'Pinterest');
g('whatsapp-x', 'WhatsApp', 'WhatsApp', 'WhatsApp');
// ---------------------------------------------------------------------------
// ClientChatWidget
// ---------------------------------------------------------------------------
g('chat-com', 'CHAT COM', 'CHAT WITH', 'CHAT CON');
g('chat-com-nossas-consultoras', 'CHAT COM NOSSAS CONSULTORAS', 'CHAT WITH OUR CONSULTANTS', 'CHAT CON NUESTRAS CONSULTORAS');
g('online-agora', 'Online agora', 'Online now', 'En línea ahora');
g('ola-sou-a', 'Olá! Sou a', 'Hi! I\'m', '¡Hola! Soy la');
g('consultora', 'Consultora', 'Consultant', 'Consultora');
g('chat.introMessage', 'Para iniciarmos nosso atendimento, por favor, me diga seu nome e e-mail.', 'To get started, please tell me your name and email.', 'Para iniciar nuestra atención, por favor dime tu nombre y correo.');
g('seu-nome-x', 'Seu Nome', 'Your Name', 'Tu Nombre');
g('conectando', 'Conectando...', 'Connecting...', 'Conectando...');
g('comecar-a-conversar', 'Começar a Conversar', 'Start Chatting', 'Empezar a Conversar');
g('digite-sua-mensagem', 'Digite sua mensagem...', 'Type your message...', 'Escribe tu mensaje...');
g('erro-ao-iniciar-chat', 'Erro ao iniciar chat.', 'Error starting chat.', 'Error al iniciar el chat.');
g('ola-meu-nome-e', 'Olá, meu nome é', 'Hi, my name is', 'Hola, mi nombre es');
g('gostaria-de-iniciar-um-atendimento', 'Gostaria de iniciar um atendimento!', 'I would like to start a conversation!', '¡Me gustaría iniciar una atención!');
// ---------------------------------------------------------------------------
// PublicProposalPage
// ---------------------------------------------------------------------------
g('proposta-nao-encontrada', 'Proposta não encontrada', 'Proposal not found', 'Propuesta no encontrada');
g('proposal.notFoundDescription', 'O link pode ter expirado ou está incorreto.', 'The link may have expired or is incorrect.', 'El enlace puede haber expirado o ser incorrecto.');
g('orcamento-exclusivo', 'Orçamento Exclusivo', 'Exclusive Quote', 'Presupuesto Exclusivo');
g('versao', 'Versão', 'Version', 'Versión');
g('atualizado-em', 'Atualizado em', 'Updated on', 'Actualizado el');
g('aprovada', 'Aprovada', 'Approved', 'Aprobada');
g('revisao-solicitada', 'Revisão Solicitada', 'Changes Requested', 'Revisión Solicitada');
g('aguardando-aprovacao', 'Aguardando Aprovação', 'Pending Approval', 'Pendiente de Aprobación');
g('itens-selecionados-no-itinerario', 'Itens Selecionados no Itinerário', 'Selected Itinerary Items', 'Elementos Seleccionados del Itinerario');
g('proposal.customService', 'Serviço personalizado de turismo de luxo.', 'Custom luxury travel service.', 'Servicio personalizado de turismo de lujo.');
g('total-do-orcamento', 'Total do Orçamento', 'Budget Total', 'Total del Presupuesto');
g('aprovar-proposta', 'Aprovar Proposta', 'Approve Proposal', 'Aprobar Propuesta');
g('ajustes', 'Ajustes', 'Adjustments', 'Ajustes');
g('proposal.adjustmentsPlaceholder', 'Ex: Gostaria de alterar a categoria do hotel ou incluir transfer privativo...', 'Ex: I would like to change the hotel category or include a private transfer...', 'Ej: Me gustaría cambiar la categoría del hotel o incluir transfer privado...');
g('cancelar', 'Cancelar', 'Cancel', 'Cancelar');
g('enviar-solicitacao', 'Enviar Solicitação', 'Send Request', 'Enviar Solicitud');
g('aprovado-pelo-link-compartilhado', 'Aprovado pelo link compartilhado', 'Approved via the shared link', 'Aprobado a través del enlace compartido');
g('solicitacao-de-alteracao-enviada', 'Solicitação de alteração enviada.', 'Change request sent.', 'Solicitud de cambio enviada.');
g('us', 'US$', 'US$', 'US$');
g('proposal.changesQuestion', 'Que mudanças ou ajustes você gostaria de solicitar?', 'What changes or adjustments would you like to request?', '¿Qué cambios o ajustes te gustaría solicitar?');
g('proposal.approvedSuccess', 'Proposta aprovada com sucesso!', 'Proposal approved successfully!', '¡Propuesta aprobada con éxito!');

// TripPlanner — faixas de orçamento e interesses (exibidos via t())
g('budget.upTo10', 'Até R$ 10 mil', 'Up to R$ 10k', 'Hasta R$ 10 mil');
g('budget.10to15', 'R$ 10 mil – R$ 15 mil', 'R$ 10k – R$ 15k', 'R$ 10 mil – R$ 15 mil');
g('budget.15to20', 'R$ 15 mil – R$ 20 mil', 'R$ 15k – R$ 20k', 'R$ 15 mil – R$ 20 mil');
g('budget.20to30', 'R$ 20 mil – R$ 30 mil', 'R$ 20k – R$ 30k', 'R$ 20 mil – R$ 30 mil');
g('budget.30to40', 'R$ 30 mil – R$ 40 mil', 'R$ 30k – R$ 40k', 'R$ 30 mil – R$ 40 mil');
g('budget.40to50', 'R$ 40 mil – R$ 50 mil', 'R$ 40k – R$ 50k', 'R$ 40 mil – R$ 50 mil');
g('budget.above50', 'Acima de R$ 50 mil', 'Above R$ 50k', 'Más de R$ 50 mil');
g('interest.honeymoon', 'Lua de mel / Casal', 'Honeymoon / Couple', 'Luna de miel / Pareja');
g('interest.leisure', 'Lazer e Turismo', 'Leisure & Tourism', 'Ocio y Turismo');
g('interest.kpop', 'K-Pop & Entretenimento', 'K-Pop & Entertainment', 'K-Pop & Entretenimiento');
g('interest.shopping', 'Compras & Moda', 'Shopping & Fashion', 'Compras y Moda');
g('interest.gastronomy', 'Gastronomia Coreana', 'Korean Gastronomy', 'Gastronomía Coreana');
g('interest.culture', 'Cultura e Tradição', 'Culture and Tradition', 'Cultura y Tradición');
g('interest.exchange', 'Intercâmbio de Idiomas', 'Language Exchange', 'Intercambio de Idiomas');
g('interest.kbeauty', 'K-Beauty & Skincare', 'K-Beauty & Skincare', 'K-Beauty & Skincare');
g('interest.adventure', 'Aventura e Natureza', 'Adventure and Nature', 'Aventura y Naturaleza');
g('interest.family', 'Família com Crianças', 'Family with Children', 'Familia con Niños');
g('interest.solo', 'Roteiro Solo', 'Solo Trip', 'Viaje Solo');
g('interest.friends', 'Grupo de Amigos', 'Friends Group', 'Grupo de Amigos');
g('auth.resetGenericMessage', 'Se o e-mail existir, enviaremos o link de redefinição.', 'If the e-mail exists, we will send the reset link.', 'Si el correo existe, enviaremos el enlace de restablecimiento.');

export const canonical = g.canonical;
export const raw = g.raw;
export const group = g.prefix;
