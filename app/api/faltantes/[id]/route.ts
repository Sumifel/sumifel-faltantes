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
    
    const { 
      descripcion, 
      codigoSae, 
      codigoProveedor, 
      marca, 
      proveedorSugerido, 
      cantidad, 
      motivo, 
      alertaSaes, 
      estatus, 
      notas 
    } = body;

    // Objeto de actualización tipado de forma segura
    const dataToUpdate: any = {};
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion;
    if (codigoSae !== undefined) dataToUpdate.codigoSae = codigoSae;
    if (codigoProveedor !== undefined) dataToUpdate.codigoProveedor = codigoProveedor;
    if (marca !== undefined) dataToUpdate.marca = marca;
    if (proveedorSugerido !== undefined) dataToUpdate.proveedorSugerido = proveedorSugerido ? String(proveedorSugerido) : null;
    if (cantidad !== undefined) dataToUpdate.cantidad = Number(cantidad);
    if (motivo !== undefined) dataToUpdate.motivo = motivo;
    if (alertaSaes !== undefined) dataToUpdate.alertaSaes = Boolean(alertaSaes);
    if (estatus !== undefined) dataToUpdate.estatus = estatus;
    if (notas !== undefined) dataToUpdate.notas = notas;

    const faltanteActualizado = await prisma.faltante.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json(faltanteActualizado);
  } catch (error) {
    console.error('Error al actualizar faltante:', error);
    return NextResponse.json({ error: 'Error al actualizar faltante' }, { status: 500 });
  }
}