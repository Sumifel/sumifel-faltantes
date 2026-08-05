import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    // Asegurar que los usuarios oficiales existan en la base de datos
    for (const u of USUARIOS_OBLIGATORIOS) {
      await prisma.usuario.upsert({
        where: { nombre: u.nombre },
        update: {},
        create: { nombre: u.nombre, rol: u.rol },
      });
    }

    const [faltantes, usuarios] = await Promise.all([
      prisma.faltante.findMany({
        orderBy: { fechaReporte: 'desc' },
        include: { reportadoPor: true },
      }),
      prisma.usuario.findMany({
        orderBy: { id: 'asc' },
      }),
    ]);

    return NextResponse.json({ faltantes, usuarios })
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return NextResponse.json({ error: 'Error al obtener los datos.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      producto, 
      codigoSae, 
      codigoProv, 
      marca, 
      proveedorSugerido, 
      cantidadSugerida, 
      motivo, 
      diferenciaSae, 
      usuarioId 
    } = body

    if (!usuarioId) {
      return NextResponse.json({ error: 'Debe seleccionar quién reporta.' }, { status: 400 })
    }

    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        codigoProv: codigoProv || null,
        marca: marca || null,
        proveedorSugerido: proveedorSugerido || null,
        cantidadSugerida: Number(cantidadSugerida),
        motivo: motivo || 'ALTA_DEMANDA',
        diferenciaSae: Boolean(diferenciaSae),
        reportadoPorId: Number(usuarioId),
      },
    })

    return NextResponse.json(nuevoFaltante, { status: 201 })
  } catch (error) {
    console.error('Error al registrar faltante:', error);
    return NextResponse.json({ error: 'Error al registrar el faltante.' }, { status: 500 })
  }
}