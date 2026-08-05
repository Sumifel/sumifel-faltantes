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

// Diccionario seguro para mapear cualquier variante del frontend al enum de Prisma
const MAPA_MOTIVOS: Record<string, string> = {
  'SIN_EXISTENCIAS': 'SIN_EXISTENCIAS',
  'Sin_Existencias': 'SIN_EXISTENCIAS',
  'Sin_ExistenciaS': 'SIN_EXISTENCIAS',
  'sin_existencias': 'SIN_EXISTENCIAS',
  'ALTA_DEMANDA': 'ALTA_DEMANDA',
  'Alta_Demanda': 'ALTA_DEMANDA',
  'alta_demanda': 'ALTA_DEMANDA',
  'URGENTE': 'URGENTE',
  'Urgente': 'URGENTE',
  'urgente': 'URGENTE',
  'NUEVO': 'NUEVO',
  'Nuevo': 'NUEVO',
  'nuevo': 'NUEVO'
};

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
      codigoProv,
      marca,
      proveedorSugerido,
      cantidad,
      cantidadSugerida,
      motivo,
      diferenciaSae,
      estatus,
      reportadoPorId,
      usuarioId,
    } = body;

    const finalCantidadSugerida = Number(cantidadSugerida ?? cantidad) || 1;
    const finalReportadoPorId = Number(reportadoPorId ?? usuarioId);
    const finalProducto = producto || descripcion || nombre;

    if (!finalProducto) {
      return NextResponse.json({ error: 'El nombre o descripción del producto es obligatorio.' }, { status: 400 });
    }

    // Mapeo seguro del motivo recibido del frontend
    const motivoCrudo = motivo || 'ALTA_DEMANDA';
    const motivoMapeado = MAPA_MOTIVOS[motivoCrudo] || 'SIN_EXISTENCIAS';

    const dataToCreate: any = {
      producto: String(finalProducto),
      codigoSae: codigoSae || null,
      codigoProv: codigoProv || codigoProveedor || null,
      marca: marca || null,
      proveedorSugerido: proveedorSugerido ? String(proveedorSugerido) : null,
      cantidadSugerida: finalCantidadSugerida,
      motivo: motivoMapeado as any, // <--- Aplicamos el valor mapeado para que coincida con el Enum
    };

    if (diferenciaSae !== undefined) {
      dataToCreate.diferenciaSae = Boolean(diferenciaSae);
    }
    if (estatus !== undefined) {
      dataToCreate.estatus = estatus;
    }

    if (finalReportadoPorId && !isNaN(finalReportadoPorId)) {
      dataToCreate.reportadoPor = {
        connect: { id: finalReportadoPorId }
      };
    } else {
      return NextResponse.json({ error: 'El usuario que reporta es obligatorio.' }, { status: 400 });
    }

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