import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Devuelve tanto los faltantes como la lista de usuarios para los selectores
export async function GET() {
  try {
    const [faltantes, usuarios] = await Promise.all([
      prisma.faltante.findMany({
        orderBy: { fechaReporte: 'desc' },
        include: { reportadoPor: true },
      }),
      prisma.usuario.findMany(),
    ])

    return NextResponse.json({ faltantes, usuarios })
  } catch (error) {
    console.error('Error al obtener datos:', error)
    return NextResponse.json({ error: 'Error al obtener los datos.' }, { status: 500 })
  }
}

// POST: Registra el faltante asociándolo al usuario seleccionado
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { producto, codigoSae, codigoProv, cantidadSugerida, motivo, diferenciaSae, usuarioId } = body

    if (!usuarioId) {
      return NextResponse.json({ error: 'Debe seleccionar quién reporta.' }, { status: 400 })
    }

    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        codigoProv: codigoProv || null,
        cantidadSugerida: Number(cantidadSugerida),
        motivo: motivo || 'ALTA_DEMANDA',
        diferenciaSae: Boolean(diferenciaSae),
        reportadoPorId: Number(usuarioId),
      },
    })

    return NextResponse.json(nuevoFaltante, { status: 201 })
  } catch (error) {
    console.error('Error al registrar faltante:', error)
    return NextResponse.json({ error: 'Error al registrar el faltante.' }, { status: 500 })
  }
}