import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener todos los faltantes ordenados del más reciente al más antiguo
export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { fechaReporte: 'desc' },
      include: {
        reportadoPor: true, // Incluye los datos del usuario que lo reportó
      },
    })
    return NextResponse.json(faltantes)
  } catch (error) {
    console.error('Error al obtener faltantes:', error)
    return NextResponse.json({ error: 'Error al obtener los faltantes.' }, { status: 500 })
  }
}

// POST: Registrar un nuevo faltante asegurando un usuario válido
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { producto, codigoSae, cantidadSugerida, diferenciaSae } = body

    // 1. Verificar si existe al menos un usuario en la base de datos
    let usuario = await prisma.usuario.findFirst()

    // 2. Si la tabla de usuarios está vacía, creamos uno por defecto automáticamente
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: 'Mostrador General',
          rol: 'MOSTRADOR',
        },
      })
    }

    // 3. Crear el registro en la tabla Faltante usando los campos exactos del esquema
    const nuevoFaltante = await prisma.faltante.create({
      data: {
        producto,
        codigoSae: codigoSae || null,
        cantidadSugerida: Number(cantidadSugerida),
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