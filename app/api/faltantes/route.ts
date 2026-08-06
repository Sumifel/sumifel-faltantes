import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Obtener todos los faltantes y usuarios
export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      include: {
        reportadoPor: true,
      },
      orderBy: {
        fechaReporte: 'desc',
      },
    });

    const usuarios = await prisma.usuario.findMany();

    return NextResponse.json({ faltantes, usuarios }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener faltantes:', error);
    return NextResponse.json({ error: 'Error interno al obtener datos' }, { status: 500 });
  }
}

// POST: Registrar un nuevo faltante ajustado a la hora de México
export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    } = body;

    if (!producto || cantidadSugerida === undefined || !usuarioId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Forzar fecha y hora exacta ajustada a la hora de México (America/Mexico_City)
    const fechaLocalStr = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
    const fechaMexico = new Date(fechaLocalStr);

    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        codigoProv: codigoProv || null,
        marca: marca || null,
        proveedorSugerido: proveedorSugerido || null,
        cantidadSugerida: parseFloat(cantidadSugerida),
        motivo: motivo || 'SIN_EXISTENCIAS',
        diferenciaSae: Boolean(diferenciaSae),
        usuarioId: parseInt(usuarioId),
        fechaReporte: fechaMexico, // <--- Guardado con la hora local correcta de México
      },
      include: {
        reportadoPor: true,
      },
    });

    return NextResponse.json({ success: true, faltante: nuevoFaltante }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar faltante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}