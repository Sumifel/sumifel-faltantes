import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { fechaReporte: 'desc' },
      include: { reportadoPor: true },
    })

    const headers = ['ID', 'Fecha', 'Producto', 'Marca', 'Codigo SAE', 'Codigo Prov', 'Proveedor Sugerido', 'Cantidad', 'Motivo', 'Reportado Por', 'Estatus', 'Diferencia SAE']
    const rows = faltantes.map(f => [
      f.id,
      new Date(f.fechaReporte).toLocaleString(),
      `"${f.producto}"`,
      `"${f.marca || ''}"`,
      `"${f.codigoSae || ''}"`,
      `"${f.codigoProv || ''}"`,
      `"${f.proveedorSugerido || ''}"`,
      f.cantidadSugerida,
      f.motivo,
      `"${f.reportadoPor?.nombre || ''}"`,
      f.estatus,
      f.diferenciaSae ? 'SI' : 'NO'
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="faltantes_sumifel.csv"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 })
  }
}