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
// JOURNAL
// ---------------------------------------------------------------------------
add('Dicas & Relatos de Viagem', 'Travel Tips & Stories', 'Consejos & Relatos de Viaje');
add('MAEUM JOURNAL', 'MAEUM JOURNAL', 'MAEUM JOURNAL');
add('Leia artigos produzidos pelas nossas consultoras e clientes compartilhando vivências, roteiros práticos e inspirações para a sua jornada.', 'Read articles produced by our consultants and clients sharing experiences, practical itineraries and inspiration for your journey.', 'Lee artículos producidos por nuestras consultoras y clientes compartiendo vivencias, itinerarios prácticos e inspiraciones para tu jornada.');
add('Por', 'By', 'Por');
add('LER ARTIGO COMPLETO', 'READ FULL ARTICLE', 'LEER ARTÍCULO COMPLETO');
add('Guia completo para explorar o Palácio Gyeongbokgung em Seul', 'Complete guide to exploring Gyeongbokgung Palace in Seoul', 'Guía completa para explorar el Palacio Gyeongbokgung en Seúl');
add('Aprenda sobre a história do palácio mais importante da dinastia Joseon, dicas de aluguel de hanbok e os melhores horários para a troca de guarda.', 'Learn about the history of the most important palace of the Joseon dynasty, hanbok rental tips and the best times for the changing of the guard.', 'Aprende sobre la historia del palacio más importante de la dinastía Joseon, consejos para alquilar hanbok y los mejores horarios para el cambio de guardia.');
add('10 de Junho, 2026', 'June 10, 2026', '10 de Junio, 2026');
add('CULTURA', 'CULTURE', 'CULTURA');
add('O que comer no Mercado de Gwangjang: O guia definitivo', 'What to eat at Gwangjang Market: The definitive guide', 'Qué comer en el Mercado de Gwangjang: La guía definitiva');
add('Do famoso tteokbokki aos bolinhos de feijão mungo (bindaetteok) e o polêmico polvo vivo. Descubra os sabores da culinária de rua de Seul.', 'From the famous tteokbokki to mung bean pancakes (bindaetteok) and the controversial live octopus. Discover the flavors of Seoul street food.', 'Del famoso tteokbokki a los panqueques de frijol mungo (bindaetteok) y el polémico pulpo vivo. Descubre los sabores de la comida callejera de Seúl.');
add('28 de Maio, 2026', 'May 28, 2026', '28 de Mayo, 2026');
add('GASTRONOMIA', 'GASTRONOMY', 'GASTRONOMÍA');