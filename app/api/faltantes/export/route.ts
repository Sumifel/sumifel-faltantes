import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda') || '';
    const estatus = searchParams.get('estatus') || 'TODOS';
    const motivo = searchParams.get('motivo') || 'TODOS';
    const alerta = searchParams.get('alerta') || 'TODOS';
    const usuarioId = searchParams.get('usuarioId') || 'TODOS';

    const where: any = {};

    if (estatus !== 'TODOS') {
      where.estatus = estatus;
    }
    if (motivo !== 'TODOS') {
      where.motivo = motivo;
    }
    if (alerta === 'SI') {
      where.diferenciaSae = true;
    } else if (alerta === 'NO') {
      where.diferenciaSae = false;
    }
    if (usuarioId !== 'TODOS') {
      where.usuarioId = parseInt(usuarioId);
    }
    if (busqueda.trim() !== '') {
      const q = busqueda.trim();
      where.OR = [
        { producto: { contains: q, mode: 'insensitive' } },
        { codigoSae: { contains: q, mode: 'insensitive' } },
        { codigoProv: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { proveedorSugerido: { contains: q, mode: 'insensitive' } },
      ];
    }

    const faltantes = await prisma.faltante.findMany({
      where,
      include: {
        reportadoPor: true,
      },
      orderBy: { fechaReporte: 'desc' },
    });

    const headers = [
      'ID',
      'Fecha',
      'Hora',
      'Producto',
      'Marca',
      'Codigo SAE',
      'Codigo Prov',
      'Proveedor',
      'Cantidad',
      'Motivo',
      'Reportado Por',
      'Estatus',
      'Diferencia SAE'
    ];

    const csvRows = [headers.join(',')];

    for (const item of faltantes) {
      const dateObj = new Date(item.fechaReporte);
      const fechaStr = dateObj.toLocaleDateString('es-MX');
      const horaStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const row = [
        item.id,
        `"${fechaStr}"`,
        `"${horaStr}"`,
        `"${(item.producto || '').replace(/"/g, '""')}"`,
        `"${(item.marca || '').replace(/"/g, '""')}"`,
        `"${(item.codigoSae || '').replace(/"/g, '""')}"`,
        `"${(item.codigoProv || '').replace(/"/g, '""')}"`,
        `"${(item.proveedorSugerido || '').replace(/"/g, '""')}"`,
        item.cantidadSugerida,
        `"${item.motivo}"`,
        `"${(item.reportadoPor?.nombre || '').replace(/"/g, '""')}"`,
        `"${item.estatus}"`,
        `"${item.diferenciaSae ? 'SI' : 'NO'}"`
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="faltantes_sumifel_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return NextResponse.json({ error: 'Error al generar exportación' }, { status: 500 });
  }
}