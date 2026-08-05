import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lista oficial de usuarios obligatorios del sistema
const USUARIOS_OBLIGATORIOS = [
  { nombre: 'Gerencia', rol: 'GERENCIA' },
  { nombre: 'Administrador', rol: 'ADMIN' },
  { nombre: 'Ventas 01', rol: 'VENTAS' },
  { nombre: 'Ventas 02', rol: 'VENTAS' },
];

export async function GET() {
  try {
    for (const u of USUARIOS_OBLIGATORIOS) {
      const existe = await prisma.usuario.findFirst({
        where: { nombre: u.nombre }
      });

      if (!existe) {
        await prisma.usuario.create({
          data: {
            nombre: u.nombre,
            rol: u.rol as any,
          },
        });
      }
    }

    const faltantes = await prisma.faltante.findMany({
      include: { reportadoPor: true },
      orderBy: { fechaReporte: 'desc' },
    });

    const usuariosRaw = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' }
    });

    const usuariosValidos = usuariosRaw
      .map(u => ({ ...u, nombre: u.nombre.trim() }))
      .filter(u => u.nombre !== 'Gerente');

    const usuarios = Array.from(
      new Map(usuariosValidos.map(u => [u.nombre, u])).values()
    );

    return NextResponse.json({ faltantes, usuarios });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      descripcion,
      codigoSae,
      codigoProveedor,
      marca,
      proveedorSugerido,
      cantidad,
      motivo,
      alertaSaes,
      reportadoPorId,
    } = body;

    // Crear el registro de forma segura convirtiendo tipos y manejando opcionales
    const nuevoFaltante = await prisma.faltante.create({
      data: {
        descripcion: descripcion || '',
        codigoSae: codigoSae || null,
        codigoProveedor: codigoProveedor || null,
        marca: marca || null,
        proveedorSugerido: proveedorSugerido ? String(proveedorSugerido) : null,
        cantidad: Number(cantidad) || 1,
        motivo: motivo || 'Alta Demanda',
        alertaSaes: Boolean(alertaSaes),
        ...(reportadoPorId ? { reportadoPorId: Number(reportadoPorId) } : {}),
      },
      include: {
        reportadoPor: true,
      }
    });

    return NextResponse.json(nuevoFaltante, { status: 201 });
  } catch (error) {
    console.error('Error detallado al registrar faltante:', error);
    return NextResponse.json({ error: 'Error al registrar el faltante' }, { status: 500 });
  }
}