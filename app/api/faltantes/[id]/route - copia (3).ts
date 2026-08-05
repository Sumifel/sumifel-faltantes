import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = parseInt(resolvedParams.id);
    
    const body = await request.json();
    const { estatus, usuarioId, pin } = body;

    if (!usuarioId) {
      return NextResponse.json({ error: 'Debe identificar qué usuario está realizando la acción.' }, { status: 400 });
    }

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

    // Validar el PIN si el usuario tiene uno configurado
    if (usuario.pin && usuario.pin !== pin) {
      return NextResponse.json({ error: 'PIN de seguridad incorrecto.' }, { status: 401 });
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = parseInt(resolvedParams.id);

    await prisma.faltante.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Faltante eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar faltante:', error);
    return NextResponse.json({ error: 'Error al eliminar el faltante' }, { status: 500 });
  }
}