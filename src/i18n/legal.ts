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
// Short keys
// ---------------------------------------------------------------------------
add(`1. Aceitação dos Termos`, `1. Acceptance of Terms`, `1. Aceptación de los Términos`);
add(`1. Informações que Coletamos`, `1. Information We Collect`, `1. Información que Recopilamos`);
add(`10. Alterações nesta Política`, `10. Changes to This Policy`, `10. Cambios en esta Política`);
add(`10. Lei Aplicável e Foro`, `10. Applicable Law and Jurisdiction`, `10. Ley Aplicable y Jurisdicción`);
add(`11. Contato do Encarregado de Dados`, `11. Contact of the Data Protection Officer`, `11. Contacto del Encargado de Datos`);
add(`15 a 30 dias`, `15 to 30 days`, `15 a 30 días`);
add(`2. Como Usamos Suas Informações`, `2. How We Use Your Information`, `2. Cómo Usamos Su Información`);
add(`2. Nossos Serviços`, `2. Our Services`, `2. Nuestros Servicios`);
add(`3. Compartilhamento de Dados`, `3. Data Sharing`, `3. Intercambio de Datos`);
add(`3. Pagamentos e Valores`, `3. Payments and Amounts`, `3. Pagos y Valores`);
add(`30 a 60 dias`, `30 to 60 days`, `30 a 60 días`);
add(`4. Cookies e Tecnologias de Rastreamento`, `4. Cookies and Tracking Technologies`, `4. Cookies y Tecnologías de Rastreo`);
add(`4. Reservas e Cancelamentos`, `4. Bookings and Cancellations`, `4. Reservas y Cancelaciones`);
add(`5. Responsabilidades do Cliente`, `5. Customer Responsibilities`, `5. Responsabilidades del Cliente`);
add(`5. Seus Direitos`, `5. Your Rights`, `5. Sus Derechos`);
add(`6. Limitação de Responsabilidade`, `6. Limitation of Liability`, `6. Limitación de Responsabilidad`);
add(`6. Segurança de Dados`, `6. Data Security`, `6. Seguridad de Datos`);
add(`7. Propriedade Intelectual`, `7. Intellectual Property`, `7. Propiedad Intelectual`);
add(`7. Retenção de Dados`, `7. Data Retention`, `7. Retención de Datos`);
add(`8. Conduta do Usuário`, `8. User Conduct`, `8. Conducta del Usuario`);
add(`8. Transferências Internacionais`, `8. International Transfers`, `8. Transferencias Internacionales`);
add(`9. Intercâmbios e Programas Educacionais`, `9. Exchange and Educational Programs`, `9. Intercambios y Programas Educativos`);
add(`9. Menores de Idade`, `9. Minors`, `9. Menores de Edad`);
add(`Alguns valores não são reembolsáveis pois já foram pagos a fornecedores no momento da reserva:`, `Some amounts are not refundable because they have already been paid to suppliers at the time of booking:`, `Algunos valores no son reembolsables porque ya fueron pagados a proveedores al momento de la reserva:`);
add(`Análise`, `Review`, `Revisión`);
add(`Ao contratar nossos serviços, você declara ter lido, compreendido e aceito integralmente estes Termos de Uso.`, `By hiring our services, you declare that you have read, understood and fully accepted these Terms of Use.`, `Al contratar nuestros servicios, usted declara haber leído, comprendido y aceptado íntegramente estos Términos de Uso.`);
add(`Após aprovação, o reembolso será processado em até 30 dias úteis na mesma forma de pagamento.`, `After approval, the refund will be processed within up to 30 business days through the same payment method.`, `Tras la aprobación, el reembolso se procesará en hasta 30 días hábiles por el mismo método de pago.`);
add(`Boleto bancário: até 15 dias úteis após compensação`, `Bank slip: up to 15 business days after clearing`, `Boleto bancario: hasta 15 días hábiles después de la compensación`);
add(`Cancelamento & Reembolso`, `Cancellation & Refund`, `Cancelación y Reembolso`);
add(`Cartão de crédito: 1-2 faturas`, `Credit card: 1-2 billing cycles`, `Tarjeta de crédito: 1-2 ciclos de facturación`);
add(`Casos Especiais`, `Special Cases`, `Casos Especiales`);
add(`Com apresentação de atestado médico, analisamos condições especiais mesmo dentro do período de 15 dias.`, `With a medical certificate, we analyze special conditions even (on approval) within the 15-day period.`, `Con atestado médico, analizamos condiciones especiales incluso dentro del período de 15 días.`);
add(`Como Solicitar Reembolso`, `How to Request a Refund`, `Cómo Solicitar un Reembolso`);
add(`Condições gerais de contratação e utilização dos nossos serviços. Leia atentamente antes de prosseguir.`, `General conditions for hiring and using our services. Read everything carefully before you proceed.`, `Condiciones generales de contratación y uso de nuestros servicios. Lea atentamente antes de continuar.`);
add(`Contato`, `Contact`, `Contacto`);
add(`Cookies`, `Cookies`, `Cookies`);
add(`Documentação`, `Documentation`, `Documentación`);
add(`Doença ou acidente:`, `Illness or accident:`, `Enfermedad o accidente:`);
add(`Dúvidas sobre Reembolso?`, `Questions about Refunds?`, `¿Dudas sobre Reembolso?`);
add(`Dúvidas? privacidade@maeumglobal.com.br`, `Questions? privacidade@maeumglobal.com.br`, `¿Preguntas? privacidade@maeumglobal.com.br`);
add(`Entre em contato com nossa equipe e descubra como podemos transformar sua experiência na Ásia em realidade.`, `Contact our team and find out how we can turn your Asia experience into reality.`, `Contacta a nuestro equipo y descubre cómo convertimos tu experiencia en Asia en realidad.`);
add(`Envie sua solicitação de cancelamento por e-mail ou WhatsApp com número do contrato e motivo.`, `Send your cancellation request by e-mail or WhatsApp, including the contract number and the reason.`, `Envía tu solicitud de cancelación por email o WhatsApp con el número de tu contrato y el motivo.`);
add(`Fale Conosco`, `Contact Us`, `Contáctenos`);
add(`Força maior:`, `Force majeure:`, `Fuerza mayor:`);
add(`Importante`, `Important`, `Importante`);
add(`Informações Importantes`, `Important Information`, `Información Importante`);
add(`Mais de 60 dias`, `More than 60 days`, `Más de 60 días`);
add(`Menos de 15 dias`, `Less than 15 days`, `Menos de 15 días`);
add(`Metade do valor pago será reembolsado`, `Half of the amount paid will be refunded`, `Se reembolsará la mitad del valor pagado`);
add(`Nossa equipe analisará seu caso e confirmará a elegibilidade conforme a política de cancelamento.`, `Our team will look at your case and confirm eligibility under the cancellation policy.`, `Nuestro equipo revisará tu caso y confirmará si cumples la política de cancelación.`);
add(`Nossa equipe financeira está disponível para esclarecer qualquer questão sobre o processo de cancelamento e reembolso.`, `Our finance team is available to answer any questions about the cancellation and refund process.`, `Nuestro equipo de finanzas está disponible para resolver cualquier duda sobre cancelaciones y reembolsos.`);
add(`O valor reembolsado varia de acordo com a antecedência do cancelamento em relação à data de início da viagem ou intercâmbio.`, `The refund amount varies with how far in advance you cancel in relation to the trip or exchange date.`, `El valor reembolsado varía según la anticipación de la cancelación respecto a la fecha de inicio del viaje o intercambio.`);
add(`PIX ou transferência: até 10 dias úteis`, `PIX or bank transfer: within 10 business days`, `PIX o transferencia: hasta 10 días hábiles`);
add(`Percentual de Reembolso por Período`, `Refund Percentage by Period`, `Porcentaje de Reembolso por Período`);
add(`Política de Privacidade`, `Privacy Policy`, `Política de Privacidad`);
add(`Política de Reembolso`, `Refund Policy`, `Política de Reembolso`);
add(`Prazos de Processamento`, `Processing Times`, `Plazo de Procesamiento`);
add(`Privacidade & Proteção de Dados`, `Privacy & Data Protection`, `Privacidad y Protección de Datos`);
add(`Problemas documentais:`, `Documentation issues:`, `Problemas documentales:`);
add(`Processamento`, `Processing`, `Procesamiento`);
add(`Pronto para planejar sua viagem dos sonhos?`, `Ready to plan your dream trip?`, `¿Listo para planear tu viaje soñado?`);
add(`Protegidos e utilizados apenas para melhorar sua experiência`, `Protected and used only to improve your experience`, `Protegidos y usados sólo para mejorar tu experiencia`);
add(`Reembolso integral menos taxa administrativa de 5%`, `Full refund minus a 5% administrative fee`, `Reembolso completo menos el 5% administrativo`);
add(`Reservas de hospedagem em alta temporada`, `Accommodation reservations in high season`, `Reservas de alojamiento en temporada alta`);
add(`Seguros viagem já contratados`, `Travel insurance already booked`, `Seguros de viaje ya contratados`);
add(`Sem reembolso disponível`, `No refund available`, `Sin reembolso disponible`);
add(`Seus Dados`, `Your Data`, `Tus Datos`);
add(`Siga os passos abaixo para iniciar o processo de cancelamento e reembolso.`, `Follow the steps below to continue with the cancellation and refund process.`, `Sigue los pasos de abajo para iniciar el proceso de cancelación y reembolso.`);
add(`Situações extraordinárias (pandemia, desastres naturais, conflitos) serão analisadas caso a caso.`, `Extraordinary cases (pandemic, natural disasters, conflicts) will be analyzed case by case.`, `Situaciones extraordinarias (pandemia, desastres naturales, conflictos) se analizarán por caso.`);
add(`Solicitar Orçamento`, `Request Pricing`, `Solicitar Cotización`);
add(`Solicitação`, `Request`, `Solicitud`);
add(`Taxas Não Reembolsáveis`, `Non-Refundable Fees`, `Tarifas No Reembolsables`);
add(`Taxas de emissão de passagens aéreas (após emissão)`, `Airline ticket issuance fees (after issuance)`, `Tarifas de emisión de boletos aéreos (tras su emisión)`);
add(`Taxas de matrícula em escolas de intercâmbio`, `Exchange school tuition fees`, `Matrícula en escuelas de intercambio`);
add(`Termos de Uso`, `Terms of Use`, `Términos de Uso`);
add(`Termos e Condições`, `Terms and Conditions`, `Términos y Condiciones`);
add(`Transparência e justiça em nossos processos de cancelamento. Conheça seus direitos e nossas condições.`, `Transparency and fairness in our refund processes. Know your rights and our conditions.`, `Transparencia y justicia en nuestros procesos de reembolso. Conoce tus derechos y nuestras condiciones.`);
add(`Transparência e segurança no tratamento dos seus dados pessoais. Sua privacidade é nossa prioridade.`, `Transparency and safety in the handling of your personal data. Your privacy is our priority.`, `Transparencia y seguridad en el tratamiento de tus datos personales. Tu privacidad es nuestra prioridad.`);
add(`Um quarto do valor pago será reembolsado`, `A quarter of the amount paid will be refunded`, `Se reembolsará un cuarto del valor pagado`);
add(`Vistos negados por motivos não atribuíveis à MaeumGlobal seguem a tabela padrão.`, `Visas refused for reasons unrelated to MaeumGlobal follow the standard policy.`, `Los visados negados por causas ajenas a MaeumGlobal siguen la tabla estándar.`);
add(`Você receberá um formulário de cancelamento que deverá ser preenchido e assinado.`, `You will receive a cancellation form to be filled and signed.`, `Recibirás un formulario de cancelación para rellenar y firmar.`);
add(`Você tem controle total sobre suas preferências`, `You have total control over your preferences`, `Tienes control total sobre tus preferencias`);
add(`Voltar ao início`, `Back to top`, `Volver al inicio`);
add(`Última atualização:`, `Last updated:`, `Última actualización:`);

// ---------------------------------------------------------------------------
// Long content keys (multiline template literals)
// ---------------------------------------------------------------------------
add(`A MaeumGlobal atua como intermediária entre cliente e fornecedores (hotéis, companhias aéreas, 
      prestadores de serviços). Não nos responsabilizamos por:
      
      • Alterações unilaterais feitas por fornecedores
      • Atrasos ou cancelamentos de voos
      • Condições climáticas que impactem a viagem
      • Problemas de saúde ou acidentes pessoais
      • Perda ou extravio de bagagem
      • Situações de força maior ou caso fortuito
      
      Faremos o melhor para auxiliar na resolução de quaisquer problemas.`, `MaeumGlobal acts as an intermediary between the client and suppliers (hotels, airlines,
      service providers). We are not responsible for:
      • Unilateral changes made by suppliers
      • Flight delays or cancellations
      • Weather conditions that may impact the trip
      • Health problems or personal injuries
      • Lost or misplaced baggage
      • Force majeure or fortuitous events

      We will do our best to help resolve any issues.`, `MaeumGlobal actúa como intermediaria entre el cliente y los proveedores (hoteles, aerolíneas,
      prestadores de servicios). No nos hacemos responsables por:
      • Cambios unilaterales realizados por los proveedores
      • Demoras o cancelaciones de vuelos
      • Condiciones climáticas que afecten el viaje
      • Problemas de salud o accidentes personales
      • Pérdida o extravío de equipaje
      • Situaciones de fuerza mayor o caso fortuito

      Haremos todo lo posible para ayudarle a resolver cualquier problema.`);
add(`A MaeumGlobal oferece:
      
      • Planejamento e organização de viagens personalizadas para a Ásia
      • Roteiros turísticos customizados
      • Reservas de hospedagem, transporte e experiências
      • Programas de intercâmbio cultural e educacional
      • Acompanhamento de grupos em viagens
      • Consultoria especializada em destinos asiáticos
      
      Os serviços exatos serão definidos em contrato específico para cada cliente.`, `MaeumGlobal offers:
      • Planning and organization of personalized trips to Asia
      • Customized itineraries
      • Booking of accommodation, transport and experiences
      • Cultural and educational exchange programs
      • Group accompaniment on trips
      • Specialized consulting on Asian destinations

      The exact services will be defined in a specific contract for each client.`, `MaeumGlobal ofrece:
      • Planificación y organización de viajes personalizados por Asia
      • Itinerarios turísticos personalizados
      • Reservas de alojamiento, transporte y experiencias
      • Programas de intercambio cultural y educativo
      • Acompañamiento de grupos en viajes
      • Consultoría especializada en destinos asiáticos

      Los servicios exactos se definirán en un contrato específico para cada cliente.`);
add(`Ao acessar e utilizar o site maeumglobal.com.br, você concorda com estes Termos de Uso. 
      Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
      
      Estes termos podem ser modificados a qualquer momento. O uso continuado do site após alterações 
      constitui aceitação dos novos termos.`, `By accessing and using the maeumglobal.com.br website, you agree to these Terms of Use.
      If you do not agree with any part of these terms, do not use our services.

      These terms may be changed at any time. Continued use of the website after changes
      constitutes your acceptance of the new terms.`, `Al acceder y utilizar el sitio web maeumglobal.com.br, usted acepta estos Términos de Uso.
      Si no está de acuerdo con alguna parte de estos términos, no utilice nuestros servicios.

      Estos términos pueden modificarse en cualquier momento. El uso continuado del sitio tras cambios
      constituye su aceptación de los nuevos términos.`);
add(`Ao utilizar nosso site e serviços, você concorda em:
      
      • Não usar o site para fins ilegais ou não autorizados
      • Não tentar acessar sistemas ou dados restritos
      • Não interferir no funcionamento adequado do site
      • Não copiar, modificar ou distribuir conteúdo sem permissão
      • Não se passar por outra pessoa ou entidade
      • Fornecer informações de contato válidas e atualizadas`, `By using our website and services, you agree to:
      • Not use the site for illegal or unauthorized purposes
      • Not attempt to access restricted systems or data
      • Not interfere with the proper functioning of the site
      • Not copy, modify or distribute content without permission
      • Not impersonate another person or entity
      • Provide valid and up-to-date contact information`, `Al utilizar nuestro sitio web y servicios, usted acepta:
      • No usar el sitio para fines ilegales o no autorizados
      • No intentar acceder a sistemas o datos restringidos
      • No interferir con el correcto funcionamiento del sitio
      • No copiar, modificar o distribuir contenido sin permiso
      • No hacerse pasar por otra persona o entidad
      • Proporcionar información de contacto válida y actualizada`);
add(`Coletamos informações que você nos fornece diretamente ao utilizar nossos serviços:
      
      • Informações de identificação pessoal: nome, e-mail, telefone, CPF, data de nascimento
      • Informações de viagem: destinos de interesse, datas preferidas, orçamento
      • Informações de pagamento: dados de cartão de crédito (processados de forma segura por terceiros)
      • Preferências de comunicação: como deseja ser contatado
      • Dados de navegação: IP, tipo de navegador, páginas visitadas (via cookies)`, `We collect information you provide directly when using our services:
      • Personal identification information: name, email, phone, CPF (Brazilian tax ID), date of birth
      • Travel information: destinations of interest, preferred dates, budget
      • Payment information: credit card data (processed securely by third parties)
      • Communication preferences: how you want to be contacted
      • Browsing data: IP, browser type, pages visited (via cookies)`, `Recopilamos información que usted nos proporciona directamente al usar nuestros servicios:
      • Información de identificación personal: nombre, email, teléfono, CPF, fecha de nacimiento
      • Información de viaje: destinos de interés, fechas preferidas, presupuesto
      • Información de pago: datos de tarjeta (procesados de forma segura por terceros)
      • Preferencias de comunicación: cómo desea ser contactado
      • Datos de navegación: IP, tipo de navegador, páginas visitadas (vía cookies)`);
add(`Como operamos viagens para a Ásia, seus dados podem ser transferidos para:
      
      • Coreia do Sul e outros países asiáticos
      • Fornecedores e parceiros internacionais de turismo
      
      Garantimos que todas as transferências sigam padrões adequados de proteção, 
      conforme exigido pela LGPD.`, `As we run trips to Asia, your data may be transferred to:
      • South Korea and other Asian countries
      • International travel suppliers and partners

      We ensure all transfers follow adequate protection standards, as required by the LGPD.`, `Como operamos viajes hasta Asia, sus datos pueden transferirse a:
      • Corea del Sur y otros países asiáticos
      • Proveedores y socios internacionales de turismo

      Garantizamos que todas las transferencias sigan estándares adecuados de protección,
      conforme a lo exigido por la LGPD.`);
add(`Como titular dos dados, você tem direito a:
      
      • Acessar suas informações pessoais que mantemos
      • Corrigir dados incompletos, inexatos ou desatualizados
      • Solicitar a exclusão de seus dados (quando aplicável)
      • Revogar consentimento para processamento de dados
      • Portabilidade dos dados para outro fornecedor de serviço
      • Opor-se ao processamento em determinadas circunstâncias
      
      Para exercer seus direitos, entre em contato: privacidade@maeumglobal.com.br`, `As the data subject, you hold these rights:
      • Access your personal information we hold
      • Correct incomplete, inaccurate or outdated data
      • Request deletion of your data (when applicable)
      • Revoke consent for data processing
      • Data portability to another service provider
      • Object to processing on certain grounds

      To exercise your rights contact: privacidade@maeumglobal.com.br`, `Como titular de datos, usted tiene derecho a:
      • Acceder a su información personal que conservamos
      • Corregir datos incompletos, inexactos o desactualizados
      • Solicitar la eliminación de sus datos (cuando corresponda)
      • Revocar el consentimiento para el tratamiento
      • Portabilidad de datos a otro proveedor
      • Oponerse al tratamiento en determinadas circunstancias

      Para ejercer sus derechos, contacte: privacidade@maeumglobal.com.br`);
add(`Dúvidas ou solicitações sobre privacidade:
      
      E-mail: privacidade@maeumglobal.com.br
      Telefone: +55 (41) 98709-4799
      Endereço: Curitiba, PR, Brasil
      
      Tempo de resposta: até 15 dias úteis`, `Questions or requests about privacy:
      E-mail: privacidade@maeumglobal.com.br
      Phone: +55 (41) 98709-4799
      Postal: Curitiba, PR, Brazil

      Response time: within 15 working days`, `Dudas o solicitudes sobre privacidad:
      Correo: privacidade@maeumglobal.com.br
      Teléfono: +55 (41) 98709-4799
      Dirección: Curitiba, PR, Brasil

      Plazo de respuesta: hasta 15 días hábiles`);
add(`Esta política pode ser atualizada periodicamente. Mudanças significativas 
      serão comunicadas através do site ou por e-mail. A versão mais recente estará 
      sempre disponível em maeumglobal.com.br/politica-de-privacidade.`, `This policy may be updated periodically. Significant changes will be announced on the website or by email. The latest version will always be at maeumglobal.com.br/politica-de-privacidade.`, `Esta política puede actualizarse periódicamente. Los cambios importantes se anunciarán en el sitio web o por email. La versión más reciente siempre estará en maeumglobal.com.br/politica-de-privacidade.`);
add(`Estes termos são regidos pelas leis da República Federativa do Brasil.
      
      Fica eleito o foro da Comarca de Curitiba/PR para resolução de quaisquer 
      questões decorrentes destes termos, com renúncia a qualquer outro, 
      por mais privilegiado que seja.
      
      Em caso de dúvidas, entre em contato: juridico@maeumglobal.com.br`, `These terms are governed by the laws of the Federative Republic of Brazil.
      The court of the District of Curitiba/PR is chosen for the resolution of any issues
      arising from these terms, with no reference to any other jurisdiction, however privileged.

      If you have questions, contact us: juridico@maeumglobal.com.br`, `Estos términos se rigen por las leyes de la República Federativa de Brasil.
      Se elige el fuero de la Comarca de Curitiba/PR para la resolución de cualquier asunto
      derivado de estos términos, con renuncia a cualquier otro, por más privilegiado que sea.

      Cualquier duda, contáctenos: juridico@maeumglobal.com.br`);
add(`Implementamos medidas de segurança técnicas e organizacionais:
      
      • Criptografia SSL/TLS para todas as transmissões de dados
      • Armazenamento seguro com acesso restrito
      • Sistemas de pagamento PCI DSS compliant
      • Monitoramento contínuo contra acessos não autorizados
      • Treinamento regular da equipe em proteção de dados
      • Backups seguros e planos de recuperação de desastres`, `We implement technical and organizational safeguarding measures:
      • SSL/TLS encryption for all data transmissions
      • Secure storage with restricted access
      • PCI DSS compliant payment systems
      • Continuous monitoring against unauthorized access
      • Regular staff training in data protection
      • Safe backups and disaster recovery plans`, `Implementamos medidas de seguridad técnicas y organizativas:
      • Cifrado SSL/TLS para todas las transmisiones de datos
      • Almacenamiento seguro con acceso restringido
      • Sistemas de pago compatibles con PCI DSS
      • Monitoreo continuo contra accesos no autorizados
      • Capacitación continua del equipo en protección de datos
      • Copias de seguridad y plan de recuperación de desastres`);
add(`Mantemos seus dados pelo tempo necessário para:
      
      • Cumprir a finalidade para a qual foram coletados
      • Cumprir obrigações contratuais e legais
      • Resolver disputas e fazer valer nossos acordos
      
      Após esse período, os dados são excluídos ou anonimizados de forma segura.`, `We keep your data for periods reasonably necessary to:
      • fulfill the purpose for which they were collected
      • comply with contractual and legal obligations
      • settle disputes and enforce our agreements

      After that, the data is deleted or safely anonymized.`, `Conservamos los datos por el tiempo necesario para:
      • cumplir la finalidad de su recolección
      • cumplir obligaciones contractuales y legales
      • resolver disputas y hacer valer nuestros acuerdos

      Después de ese período, los datos se eliminan o se anonimizan de forma segura.`);
add(`Nossos serviços são direcionados a maiores de 18 anos. Para menores:
      
      • Requeremos consentimento dos pais ou responsáveis legais
      • Coletamos apenas dados necessários para a viagem
      • Tratamos os dados com proteção reforçada
      • Não direcionamos marketing diretamente a menores`, `Our services are for people aged 18 and over. For minors:
      • We need the consent of parents or guardians
      • We collect only the data necessary for the trip
      • We handle such data with increased protection
      • We do not target marketing at minors`, `Nuestros servicios se dirigen a mayores de 18 años. Para menores:
      • Requerimos el consentimiento de padres o representantes
      • Sólo recogemos los datos necesarios para el viaje
      • Tratamos sus datos con protección reforzada
      • No dirigimos marketing a menores`);
add(`O cliente é responsável por:
      
      • Fornecer informações verdadeiras e completas
      • Possuir documentação necessária (passaporte, vistos, vacinas)
      • Respeitar leis e costumes dos países visitados
      • Comparecer em horários e locais estabelecidos
      • Comunicar necessidades especiais ou restrições
      • Contratar seguro viagem (obrigatório para intercâmbios)
      
      A MaeumGlobal não se responsabiliza por problemas decorrentes do descumprimento.`, `The client is responsible for:
      • Providing true and complete information
      • Holding the required documentation (passport, visas, vaccinations)
      • Respecting the laws and customs of the countries visited
      • Being present at established times and places
      • Communicating special needs or restrictions
      • Taking out travel insurance (mandatory for exchanges)

      MaeumGlobal is not responsible for problems caused by failure to comply.`, `El cliente es responsable de:
      • Aportar información veraz y completa
      • Contar con la documentación necesaria (pasaporte, visados, vacunas)
      • Respetar las leyes y costumbres de los países visitados
      • Comparecer en horarios y lugares establecidos
      • Comunicar necesidades especiales o restricciones
      • Contratar seguro de viaje (obligatorio para intercambios)

      MaeumGlobal no se responsabiliza de problemas derivados del incumplimiento.`);
add(`Para programas de intercâmbio:
      
      • Matrículas são pessoais e intransferíveis
      • Visto de estudante é responsabilidade do aluno (com nossa orientação)
      • Frequência mínima exigida conforme regulamentação do país
      • Desempenho acadêmico é responsabilidade do aluno
      • Hospedagem está sujeita aos termos do fornecedor parceiro
      • Seguro saúde é obrigatório durante todo o período
      
      Consulte condições específicas de cada programa.`, `For exchange programs:
      • Enrolments are personal and non-transferable
      • Student visa is the student's responsibility (with our support)
      • Minimum attendance required under the country's rules
      • Academic performance is the student's responsibility
      • Accommodation subject to the partner provider terms
      • Health insurance is mandatory throughout the period

      See the specific terms of each program.`, `Para programas de intercambio:
      • Las matrículas son personales e intransferibles
      • El visado de estudiante es responsabilidad del alumno (con nuestra orientación)
      • Se exige una frecuencia mínima según la regulación del país
      • El desempeño académico es responsabilidad del alumno
      • El alojamiento está sujeto a las condiciones del proveedor
      • El seguro médico es obligatorio durante todo el período

      Consulta las condiciones específicas de cada programa.`);
add(`Política de cancelamento:
      
      • Cancelamento com mais de 60 dias da viagem: reembolso integral (exceto taxa administrativa de 5%)
      • Cancelamento entre 30-60 dias: 50% de reembolso
      • Cancelamento entre 15-30 dias: 25% de reembolso
      • Cancelamento com menos de 15 dias: sem reembolso
      
      Casos de força maior (doença, problemas documentais, eventos climáticos) serão analisados 
      individualmente e podem ter condições especiais.`, `Cancellation policy:
      • Cancel with more than 60 days to the trip: full refund (except an administrative 5% fee)
      • Cancel between 30 and 60 days: 50% refund
      • Cancel between 15 and 30 days: 25% refund
      • Cancel under 15 days: no refund

      Force majeure events (illness, documentation issues, climate events) are reviewed case by case and may receive special conditions.`, `Política de cancelación:
      • Cancelación a más de 60 días del viaje: reembolso integral (excepto arancel administrativo de 5%)
      • Cancelación entre 30 y 60 días: 50% de reembolso
      • Cancelación entre 15 y 30 días: 25% de reembolso
      • Cancelación dentro de 15 días: sin reembolso

      Los casos de fuerza mayor (enfermedad, problemas documentales, eventos climáticos) se estudiarán individualmente y podrán tener condiciones especiales.`);
add(`Seus dados podem ser compartilhados apenas nas seguintes situações:
      
      • Fornecedores de serviços: hotéis, companhias aéreas, operadoras de turismo na Ásia
      • Processadores de pagamento: para processamento seguro de transações
      • Autoridades governamentais: quando exigido por lei (imigração, alfândega)
      • Parceiros de intercâmbio: escolas e instituições educacionais
      • Prestadores de experiências: guias, restaurantes, atrações turísticas
      
      Não vendemos, alugamos ou comercializamos seus dados pessoais.`, `Your data may be shared only in the following situations:
      • Service suppliers: hotels, airlines, tour operators in Asia
      • Payment processors: for secure transaction processing
      • Government authorities: if required by law (immigration, customs)
      • Exchange partners: schools and educational institutions
• Experience providers: guides, restaurants, tourist attractions

      We never sell, lease or market your personal data.`, `Tus datos solo pueden compartirse en los siguientes casos:
      • Proveedores de servicios: hoteles, aerolíneas, tour operadores en Asia
      • Procesadores de pago para procesar los pagos de forma segura
      • Autoridades gubernamentales: cuando lo exige la ley (inmigración, aduana)
      • Socios de intercambio: escuelas e instituciones educativas
      • Prestadores de experiencias: guías, restaurantes y atracciones turísticas

      Nunca vendemos, alquilamos o comercializamos tus datos personales.`);
add(`Todo o conteúdo do site (textos, imagens, logotipos, vídeos, roteiros) é de propriedade 
      da MaeumGlobal e protegido por leis de direitos autorais.
      
      É proibida a reprodução, distribuição ou uso comercial sem autorização prévia por escrito.
      
      O uso é permitido apenas para fins pessoais e não comerciais.`, `All website content (texts, images, logos, videos, routes) is the property of MaeumGlobal
      and protected by copyright law.

      Reproduction, distribution or commercial use without written authorization is prohibited.

      Use is permitted for personal, non-commercial purposes only.`, `Todo el contenido del sitio (textos, imágenes, logos, videos, itinerarios) es propiedad de
MaeumGlobal y está protegido por leyes de protección de datos y derechos de autor.

      Queda prohibida la reproducción, distribución o uso comercial sin autorización previa por escrito.

      Sólo se permite su uso con fines personales y no comerciales.`);
add(`Utilizamos diferentes tipos de cookies:
      
      • Cookies essenciais: necessários para o funcionamento do site
      • Cookies analíticos: Google Analytics para entender o uso do site
      • Cookies de funcionalidade: memorizar preferências e configurações
      • Cookies de marketing: exibir anúncios relevantes (com seu consentimento)
      
      Você pode gerenciar suas preferências de cookies a qualquer momento.`, `We use different types of cookies:
      • Necessary cookies: required for the operation
      • Statistical cookies: Google Analytics to understand usage
      • Functionality cookies: to remember prefs and settings
      • Marketing cookies: show relevant ads (with consent)

      You can toggle your cookie choices at any time.`, `Usamos distintos tipos de cookies:
      • Necesarias: imprescindibles para funcionar
      • Analíticas: estadísticas para conocer el uso
      • De funcionalidad: recordar preferencias
      • De marketing: mostrar anuncios si nos das permiso

      Puedes gestionar tus preferencias de cookies en cualquier momento.`);
add(`Utilizamos suas informações para:
      
      • Personalizar roteiros e experiências de viagem
      • Processar reservas e pagamentos
      • Enviar confirmações e atualizações sobre sua viagem
      • Fornecer suporte antes, durante e após sua experiência
      • Enviar materiais promocionais (apenas com seu consentimento)
      • Melhorar continuamente nossos serviços
      • Cumprir obrigações legais e regulatórias`, `We use your data to:
• Custom tailor-made itineraries and travel experiences
      • Process bookings and payments
• Send trip confirmations and updates
• Support you before, during and after your experience
• Send promotion with your approval only
• Improve our services continuously
• Meet regulations and duties`, `Utilizamos sus datos para:
      • personalizar itinerarios y experiencias
      • procesar reservas y pagos
      • enviar confirmaciones y novedades
      • brindarte soporte durante la experiencia
      • enviar promocionales (solo con tu consentimiento)
      • mejorar continuamente nuestros servicios
      • cumplir obligaciones legales y regulatorias`);
add(`• Todos os valores estão em Reais (BRL) salvo indicação contrária
      • Pagamentos podem ser realizados via cartão de crédito, transferência ou PIX
      • Parcelamento disponível conforme condições contratuais
      • Valores podem sofrer alteração até confirmação final da reserva
      • Taxas cambiais podem impactar valores de serviços internacionais
      • Pagamentos devem ser realizados nas datas estipuladas em contrato
      
      O não pagamento nas datas acordadas pode resultar em cancelamento da reserva.`, `• All amounts are in Reais (BRL) unless otherwise stated
      • Payment can be made by credit card, transfer or PIX
      • PIX installments may be available
      • The amounts may be changed until the reservation is confirmed
      • Exchange rates may impact international services
      • Payment must be completed on the dates in the contract

Failure to pay on due date may result in cancellation of the reservation.`, `• Todos los importes están en Reales (BRL) salvo que se indique lo contrario
      • Puedes pagar con tarjeta, transferencia o PIX
      • El plan de cuotas puede estar disponible
      • Los valores pueden variar hasta confirmar la reserva
      • El tipo de cambio puede afectar los servicios internacionales
      • El pago debe realizarse en las fechas del contrato
      La falta de pago puede causar la cancelación de la reserva.`);
