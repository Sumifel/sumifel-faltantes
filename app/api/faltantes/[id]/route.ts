import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    const body = await request.json();
    const { estatus, usuarioId } = body;

    if (!usuarioId) {
      return NextResponse.json({ error: 'Debe identificar qué usuario está realizando la acción.' }, { status: 400 });
    }

    // Verificar el rol del usuario que intenta hacer el cambio
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Validar si es Gerencia o Admin
    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'GERENCIA') {
      return NextResponse.json({ error: 'Acceso denegado: Solo el Gerente o Administrador pueden cambiar el estatus.' }, { status: 403 });
    }

    const faltanteActualizado = await prisma.faltante.update({
      where: { id },
      data: { estatus },
    });

    return NextResponse.json(faltanteActualizado);
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    return NextResponse.json({ error: 'Error al actualizar el estatus.' }, { status: 500 });
  }
}