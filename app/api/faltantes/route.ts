import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener todos los faltantes ordenados del más reciente al más antiguo
export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      include: {
        reportadoPor: true, // Trae los datos de la vendedora que lo reportó
      },
      orderBy: {
        fechaReporte: 'desc',
      },
    })
    return NextResponse.json(faltantes)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los faltantes' }, { status: 500 })
  }
}

// POST: Crear un nuevo faltante (el reporte del mostrador)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { producto, codigoSae, cantidadSugerida, diferenciaSae, reportadoPorId } = body

    // Validación básica
    if (!producto || cantidadSugerida === undefined || !reportadoPorId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        cantidadSugerida: parseFloat(cantidadSugerida),
        diferenciaSae: diferenciaSae || false,
        reportadoPorId: parseInt(reportadoPorId),
      },
      include: {
        reportadoPor: true,
      }
    })

    return NextResponse.json(nuevoFaltante, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al registrar el faltante' }, { status: 500 })
  }
}