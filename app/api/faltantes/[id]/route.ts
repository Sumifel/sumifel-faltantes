import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    const body = await request.json();
    
    const { estatus, cantidad, motivo, alertaSaes, notas } = body;

    // Actualizamos el registro en la base de datos de forma segura
    const faltanteActualizado = await prisma.faltante.update({
      where: { id: Number(id) },
      data: {
        ...(estatus !== undefined && { estatus }),
        ...(cantidad !== undefined && { cantidad: Number(cantidad) }),
        ...(motivo !== undefined && { motivo }),
        ...(alertaSaes !== undefined && { alertaSaes }),
        ...(notas !== undefined && { notas }),
      },
    });

    return NextResponse.json(faltanteActualizado);
  } catch (error) {
    console.error('Error al actualizar faltante:', error);
    return NextResponse.json({ error: 'Error al actualizar faltante' }, { status: 500 });
  }
}