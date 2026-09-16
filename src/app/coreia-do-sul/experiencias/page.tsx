import React from 'react';
import { prisma } from '@/lib/prisma';
import ExperienciasClientPage from './_components/ExperienciasClientPage';

// ─── SERVER PAGE: fetch data, pass to client ────────────────
export const metadata = {
  title: 'Experiências na Coreia do Sul | Maeum Global',
  description:
    'Explore experiências cuidadosamente selecionadas em Seul — de rituais de bem-estar a tours gastronômicos.',
};

export default async function CoreiaExperienciasPage() {
  const [experiencesResult, categoriesResult] = await Promise.all([
    prisma.experience.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: { categories: { include: { category: true } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  // Normalise to the shape the client component expects
  const experiences = experiencesResult.map((exp) => ({
    id: exp.id,
    slug: exp.slug,
    title: exp.title,
    subtitle: exp.subtitle ?? '',
    description: exp.description ?? '',
    location: exp.location ?? 'Seul',
    city: exp.location ?? 'Seul',
    duration_hours: exp.durationHours,
    price_per_person: exp.pricePerPerson,
    main_image: exp.mainImage ?? 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600',
    booking_type: exp.bookingType ?? 'request',
    status: exp.status,
    category_slugs: exp.categories.map((ec) => ec.category.slug),
  }));

  const categories = categoriesResult.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    active: cat.isActive,
    sort_order: cat.sortOrder,
  }));

  return <ExperienciasClientPage experiences={experiences} categories={categories} />;
}
