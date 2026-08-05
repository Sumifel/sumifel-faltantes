import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH: Actualiza el estatus de un faltante específico por su ID
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const faltanteId = parseInt(id)
    const body = await request.json()
    const { estatus } = body

    // Validamos que el estatus enviado sea uno de los 3 permitidos
    const estatusValidos = ['PENDIENTE', 'EN_PEDIDO', 'RECIBIDO']
    if (!estatusValidos.includes(estatus)) {
      return NextResponse.json({ error: 'Estatus no válido' }, { status: 400 })
    }

    const faltanteActualizado = await prisma.faltante.update({
      where: { id: faltanteId },
      data: { estatus },
    })

    return NextResponse.json(faltanteActualizado)
  } catch (error) {
    console.error('Error al actualizar el estatus:', error)
    return NextResponse.json({ error: 'Error al actualizar el estatus.' }, { status: 500 })
  }
}