import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
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
      estatus, 
      usuarioId, 
      pin 
    } = body;

    // Validar que se envíe el usuario
    if (!usuarioId) {
      return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 });
    }

    // Verificar permisos de Gerencia o Admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });

    if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'GERENCIA')) {
      return NextResponse.json({ error: 'No autorizado para realizar modificaciones' }, { status: 403 });
    }

    // Realizar la actualización en la base de datos con todos los campos enviados
    const faltanteActualizado = await prisma.faltante.update({
      where: { id },
      data: {
        ...(producto !== undefined && { producto }),
        ...(codigoSae !== undefined && { codigoSae }),
        ...(codigoProv !== undefined && { codigoProv }),
        ...(marca !== undefined && { marca }),
        ...(proveedorSugerido !== undefined && { proveedorSugerido }),
        ...(cantidadSugerida !== undefined && { cantidadSugerida: Number(cantidadSugerida) }),
        ...(motivo !== undefined && { motivo }),
        ...(diferenciaSae !== undefined && { diferenciaSae }),
        ...(estatus !== undefined && { estatus }),
      },
      include: {
        reportadoPor: true
      }
    });

    return NextResponse.json({ success: true, faltante: faltanteActualizado });
  } catch (error) {
    console.error('Error al actualizar el faltante:', error);
    return NextResponse.json({ error: 'Error interno del servidor al actualizar' }, { status: 500 });
  }
}