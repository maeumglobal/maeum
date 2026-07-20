'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPackages() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: packages };
  } catch (error) {
    console.error('Error fetching packages:', error);
    return { success: false, error: 'Erro ao buscar pacotes.' };
  }
}

export async function createPackage(data: {
  title: string;
  slug: string;
  destination?: string;
  price: number;
  description?: string;
  status?: string;
}) {
  try {
    const newPackage = await prisma.package.create({
      data: {
        title: data.title,
        slug: data.slug,
        destination: data.destination || '',
        price: data.price,
        description: data.description || '',
        status: data.status || 'active',
        gallery: '[]', // default empty gallery
      }
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: newPackage };
  } catch (error: any) {
    console.error('Error creating package:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Já existe um pacote com esse slug.' };
    }
    return { success: false, error: 'Erro ao criar pacote.' };
  }
}

export async function updatePackageStatus(id: string, status: string) {
  try {
    const updated = await prisma.package.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating package status:', error);
    return { success: false, error: 'Erro ao atualizar status.' };
  }
}

export async function deletePackage(id: string) {
  try {
    await prisma.package.delete({
      where: { id }
    });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting package:', error);
    return { success: false, error: 'Erro ao excluir pacote.' };
  }
}
