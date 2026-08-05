import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Trae la lista de todos los faltantes ordenados del más reciente al más antiguo
export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { fechaReporte: 'desc' },
      include: { reportadoPor: true },
    })
    return NextResponse.json(faltantes)
  } catch (error) {
    console.error('Error al obtener faltantes:', error)
    return NextResponse.json({ error: 'Error al obtener los faltantes.' }, { status: 500 })
  }
}

// POST: Recibe los datos del formulario web y los guarda en la base de datos
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { producto, codigoSae, codigoProv, cantidadSugerida, motivo, diferenciaSae } = body

    // Buscamos un usuario por defecto para asociar el reporte
    let usuario = await prisma.usuario.findFirst()
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: { nombre: 'Mostrador General', rol: 'MOSTRADOR' },
      })
    }

    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        codigoProv: codigoProv || null, // Aquí guardamos el texto libre que escriban del proveedor
        cantidadSugerida: Number(cantidadSugerida),
        motivo: motivo || 'ALTA_DEMANDA',
        diferenciaSae: Boolean(diferenciaSae),
        reportadoPorId: usuario.id,
      },
    })

    return NextResponse.json(nuevoFaltante, { status: 201 })
  } catch (error) {
    console.error('Error al registrar faltante:', error)
    return NextResponse.json({ error: 'Error al registrar el faltante.' }, { status: 500 })
  }
}