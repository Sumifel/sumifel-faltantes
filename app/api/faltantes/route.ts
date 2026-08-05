import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Definimos los usuarios obligatorios del sistema
const USUARIOS_OBLIGATORIOS = [
  { nombre: 'Ventas 02', rol: 'VENTAS' },
  { nombre: 'Ventas 10', rol: 'VENTAS' },
  { nombre: 'Ventas 12', rol: 'VENTAS' },
  { nombre: 'Ventas 16', rol: 'VENTAS' },
  { nombre: 'Almacen', rol: 'ALMACEN' },
  { nombre: 'Gerente', rol: 'GERENCIA' },
  { nombre: 'Administrador', rol: 'ADMIN' },
];

export async function GET() {
  try {
    // Asegurar que los usuarios oficiales existan en la base de datos de forma segura
    for (const u of USUARIOS_OBLIGATORIOS) {
      const existe = await prisma.usuario.findFirst({
        where: { nombre: u.nombre }
      });

      if (!existe) {
        await prisma.usuario.create({
          data: {
            nombre: u.nombre,
            rol: u.rol,
          },
        });
      }
    }

    // Obtener la lista de faltantes incluyendo quién los reportó
    const faltantes = await prisma.faltante.findMany({
      include: { reportadoPor: true },
      orderBy: { fechaReporte: 'desc' },
    });

    // Obtener todos los usuarios actualizados
    const usuarios = await prisma.usuario.findMany();

    return NextResponse.json({ faltantes, usuarios });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}