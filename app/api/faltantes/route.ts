import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener todos los faltantes ordenados del más reciente al más antiguo
export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { id: 'desc' }, // O por fecha de creación si tienes un campo de fecha
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
    const { nombre, codigoSae, cantidad, diferenciaInventario } = body

    // 1. Verificar si existe al menos un usuario en la base de datos
    let usuario = await prisma.usuario.findFirst()

    // 2. Si no existe ninguno, creamos uno por defecto automáticamente
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: 'Mostrador General',
          rol: 'ADMIN' // Ajusta el rol según tu esquema (ej. EMPLEADO o string equivalente)
        },
      })
    }

    // 3. Crear el faltante utilizando obligatoriamente el ID del usuario
    const nuevoFaltante = await prisma.faltante.create({
      data: {
        nombre,
        codigoSae: codigoSae || null,
        cantidad: Number(cantidad),
        diferenciaInventario: Boolean(diferenciaInventario),
        reportadoPorId: usuario.id, // Campo obligatorio satisfecho de forma automática
      },
    })

    return NextResponse.json(nuevoFaltante, { status: 201 })
  } catch (error) {
    console.error('Error al registrar faltante:', error)
    return NextResponse.json({ error: 'Error al registrar el faltante.' }, { status: 500 })
  }
}