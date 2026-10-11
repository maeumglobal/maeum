import { makeGroup } from './group';

const g = makeGroup('journal');

// ---------------------------------------------------------------------------
// JOURNAL
// ---------------------------------------------------------------------------
g('kicker', 'Dicas & Relatos de Viagem', 'Travel Tips & Stories', 'Consejos & Relatos de Viaje');
g('maeum-journal', 'MAEUM JOURNAL', 'MAEUM JOURNAL', 'MAEUM JOURNAL');
g('description', 'Leia artigos produzidos pelas nossas consultoras e clientes compartilhando vivências, roteiros práticos e inspirações para a sua jornada.', 'Read articles produced by our consultants and clients sharing experiences, practical itineraries and inspiration for your journey.', 'Lee artículos producidos por nuestras consultoras y clientes compartiendo vivencias, itinerarios prácticos e inspiraciones para tu jornada.');
g('por', 'Por', 'By', 'Por');
g('ler-artigo-completo', 'LER ARTIGO COMPLETO', 'READ FULL ARTICLE', 'LEER ARTÍCULO COMPLETO');
g('articles.1title', 'Guia completo para explorar o Palácio Gyeongbokgung em Seul', 'Complete guide to exploring Gyeongbokgung Palace in Seoul', 'Guía completa para explorar el Palacio Gyeongbokgung en Seúl');
g('articles.1excerpt', 'Aprenda sobre a história do palácio mais importante da dinastia Joseon, dicas de aluguel de hanbok e os melhores horários para a troca de guarda.', 'Learn about the history of the most important palace of the Joseon dynasty, hanbok rental tips and the best times for the changing of the guard.', 'Aprende sobre la historia del palacio más importante de la dinastía Joseon, consejos para alquilar hanbok y los mejores horarios para el cambio de guardia.');
g('articles.1date', '10 de Junho, 2026', 'June 10, 2026', '10 de Junio, 2026');
g('cultura', 'CULTURA', 'CULTURE', 'CULTURA');
g('articles.2title', 'O que comer no Mercado de Gwangjang: O guia definitivo', 'What to eat at Gwangjang Market: The definitive guide', 'Qué comer en el Mercado de Gwangjang: La guía definitiva');
g('articles.2excerpt', 'Do famoso tteokbokki aos bolinhos de feijão mungo (bindaetteok) e o polêmico polvo vivo. Descubra os sabores da culinária de rua de Seul.', 'From the famous tteokbokki to mung bean pancakes (bindaetteok) and the controversial live octopus. Discover the flavors of Seoul street food.', 'Del famoso tteokbokki a los panqueques de frijol mungo (bindaetteok) y el polémico pulpo vivo. Descubre los sabores de la comida callejera de Seúl.');
g('articles.2date', '28 de Maio, 2026', 'May 28, 2026', '28 de Mayo, 2026');
g('gastronomia', 'GASTRONOMIA', 'GASTRONOMY', 'GASTRONOMÍA');

// ---------------------------------------------------------------------------
// JOURNAL · SEO E DETALHE (`/journal/[slug]`) — dados do Prisma
// ---------------------------------------------------------------------------
g('seo.title', 'Journal de Viagens na Coreia do Sul | Maeum Global', 'South Korea Travel Journal | Maeum Global', 'Journal de Viajes a Corea del Sur | Maeum Global');
g('seo.description', 'Guias práticos, relatos de viagem e dicas de quem vive a Coreia do Sul: rituais, gastronomia, K-Beauty e cultura.', 'Practical guides, travel stories and tips from people who live in South Korea: rituals, food, K-Beauty and culture.', 'Guías prácticas, relatos de viaje y consejos de quienes viven en Corea del Sur: rituales, gastronomía, K-Beauty y cultura.');
g('seo.detailSuffix', 'Journal Maeum Global', 'Maeum Global Journal', 'Journal Maeum Global');

g('list.featured', 'EM DESTAQUE', 'FEATURED', 'DESTACADO');
g('list.allPosts', 'TODOS OS ARTIGOS', 'ALL ARTICLES', 'TODOS LOS ARTÍCULOS');
g('list.emptyTitle', 'Nenhum artigo publicado ainda', 'No article published yet', 'Ningún artículo publicado todavía');
g('list.emptyDescription', 'Estamos preparando os primeiros relatos de viagem. Volte em breve.', 'We are preparing the first travel stories. Come back soon.', 'Estamos preparando los primeros relatos de viaje. Vuelve pronto.');

g('detail.readingTime', '{n} min de leitura', '{n} min read', '{n} min de lectura');
g('detail.publishedOn', 'Publicado em {date}', 'Published on {date}', 'Publicado el {date}');
g('detail.updatedOn', 'Atualizado em {date}', 'Updated on {date}', 'Actualizado el {date}');
g('detail.backToJournal', 'Voltar para o Journal', 'Back to the Journal', 'Volver al Journal');
g('detail.relatedTitle', 'Continue lendo', 'Keep reading', 'Sigue leyendo');
g('detail.tags', 'TAGS', 'TAGS', 'ETIQUETAS');
g('detail.imageAlt', 'Capa do artigo: {title}', 'Article cover: {title}', 'Portada del artículo: {title}');
g('detail.bodyMissing', 'O texto completo deste artigo ainda não foi publicado.', 'The full text of this article has not been published yet.', 'El texto completo de este artículo aún no se ha publicado.');

export const canonical = g.canonical;
export const raw = g.raw;
export const group = g.prefix;
