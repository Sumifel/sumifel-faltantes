import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ajusta la ruta de tu cliente prisma si es distinta

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda') || '';
    const estatus = searchParams.get('estatus') || 'TODOS';
    const motivo = searchParams.get('motivo') || 'TODOS';
    const alerta = searchParams.get('alerta') || 'TODOS';
    const usuarioId = searchParams.get('usuarioId') || 'TODOS';
    const fechaInicio = searchParams.get('fechaInicio') || '';
    const fechaFin = searchParams.get('fechaFin') || '';

    // Construir filtros dinámicos para Prisma
    const whereClause: any = {};

    if (busqueda) {
      whereClause.OR = [
        { producto: { contains: busqueda, mode: 'insensitive' } },
        { codigoSae: { contains: busqueda, mode: 'insensitive' } },
        { codigoProv: { contains: busqueda, mode: 'insensitive' } },
        { marca: { contains: busqueda, mode: 'insensitive' } },
        { proveedorSugerido: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (estatus !== 'TODOS') {
      whereClause.estatus = estatus;
    }

    if (motivo !== 'TODOS') {
      whereClause.motivo = motivo;
    }

    if (alerta === 'SI') {
      whereClause.diferenciaSae = true;
    } else if (alerta === 'NO') {
      whereClause.diferenciaSae = false;
    }

    if (usuarioId !== 'TODOS') {
      whereClause.usuarioId = parseInt(usuarioId);
    }

    if (fechaInicio || fechaFin) {
      whereClause.fechaReporte = {};
      if (fechaInicio) {
        whereClause.fechaReporte.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
      }
      if (fechaFin) {
        whereClause.fechaReporte.lte = new Date(`${fechaFin}T23:59:59.999Z`);
      }
    }

    const faltantes = await prisma.faltante.findMany({
      where: whereClause,
      include: {
        reportadoPor: true,
      },
      orderBy: {
        fechaReporte: 'desc',
      },
    });

    // Generar contenido CSV con la hora correcta en horario de México
    const headers = ['Fecha', 'Producto', 'Marca', 'Codigo SAE', 'Codigo Prov', 'Proveedor Sugerido', 'Cantidad', 'Motivo', 'Diferencia SAE', 'Estatus', 'Reportado Por'];
    
    const rows = faltantes.map((item) => {
      // CORRECCIÓN DE HORA: Forzar zona horaria de México
      const fechaLocal = new Date(item.fechaReporte).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      return [
        `"${fechaLocal}"`,
        `"${item.producto.replace(/"/g, '""')}"`,
        `"${(item.marca || '').replace(/"/g, '""')}"`,
        `"${(item.codigoSae || '').replace(/"/g, '""')}"`,
        `"${(item.codigoProv || '').replace(/"/g, '""')}"`,
        `"${(item.proveedorSugerido || '').replace(/"/g, '""')}"`,
        item.cantidadSugerida,
        `"${item.motivo}"`,
        item.diferenciaSae ? 'SÍ' : 'NO',
        `"${item.estatus}"`,
        `"${(item.reportadoPor?.nombre || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const bom = '\uFEFF'; // BOM para que Excel reconozca acentos y caracteres especiales UTF-8

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte_faltantes_sumifel_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return NextResponse.json({ error: 'Error al generar el archivo CSV' }, { status: 500 });
  }
}