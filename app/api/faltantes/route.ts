import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const USUARIOS_OBLIGATORIOS = [
  { nombre: 'Gerente', rol: 'GERENCIA' },
  { nombre: 'Administrador', rol: 'ADMIN' },
  { nombre: 'Ventas 02', rol: 'VENTAS' },
  { nombre: 'Ventas 10', rol: 'VENTAS' },
  { nombre: 'Ventas 12', rol: 'VENTAS' },
  { nombre: 'Ventas 16', rol: 'VENTAS' },
  { nombre: 'Almacen', rol: 'ALMACEN' },
  { nombre: 'Mostrador', rol: 'EMPLEADO' },
];

export async function GET() {
  try {
    for (const u of USUARIOS_OBLIGATORIOS) {
      const existe = await prisma.usuario.findFirst({
        where: { nombre: u.nombre }
      });
      if (!existe) {
        await prisma.usuario.create({
          data: {
            nombre: u.nombre,
            rol: u.rol as any,
          },
        });
      }
    }

    const faltantes = await prisma.faltante.findMany({
      include: { reportadoPor: true },
      orderBy: { fechaReporte: 'desc' },
    });

    const usuariosRaw = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' }
    });

    const usuariosValidos = usuariosRaw.map(u => ({ ...u, nombre: u.nombre.trim() }));

    const usuarios = Array.from(
      new Map(usuariosValidos.map(u => [u.nombre, u])).values()
    );

    return NextResponse.json({ faltantes, usuarios });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      descripcion,
      nombre,
      producto,
      codigoSae,
      codigoProveedor,
      marca,
      proveedorSugerido,
      cantidad,
      motivo,
      alertaSaes,
      reportadoPorId,
    } = body;

    const dataToCreate: any = {
      codigoSae: codigoSae || null,
      codigoProveedor: codigoProveedor || null,
      marca: marca || null,
      proveedorSugerido: proveedorSugerido ? String(proveedorSugerido) : null,
      cantidad: Number(cantidad) || 1,
      motivo: motivo || 'Alta Demanda',
      alertaSaes: Boolean(alertaSaes),
    };

    if (descripcion !== undefined) dataToCreate.descripcion = descripcion;
    if (nombre !== undefined) dataToCreate.nombre = nombre;
    if (producto !== undefined) dataToCreate.producto = producto;
    if (reportadoPorId) dataToCreate.reportadoPorId = Number(reportadoPorId);

    const nuevoFaltante = await prisma.faltante.create({
      data: dataToCreate,
      include: {
        reportadoPor: true,
      }
    });

    return NextResponse.json(nuevoFaltante, { status: 201 });
  } catch (error) {
    console.error('Error detallado al registrar faltante:', error);
    return NextResponse.json({ error: 'Error al registrar el faltante' }, { status: 500 });
  }
}