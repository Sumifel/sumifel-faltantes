import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { fechaReporte: 'desc' },
      include: { reportadoPor: true },
    })

    // Definimos las columnas que tendrá el archivo de Excel
    let csv = 'ID,Fecha de Captura,Producto,Codigo SAE,Codigo Proveedor,Cantidad Sugerida,Motivo,Diferencia SAE,Estatus\n'

    faltantes.forEach((f) => {
      const producto = `"${f.producto.replace(/"/g, '""')}"`
      const codigoSae = `"${f.codigoSae || ''}"`
      const codigoProv = `"${f.codigoProv || ''}"`
      const motivo = f.motivo
      const diferencia = f.diferenciaSae ? 'SÍ' : 'NO'
      const fecha = new Date(f.fechaReporte).toLocaleString()
      
      csv += `${f.id},"${fecha}",${producto},${codigoSae},${codigoProv},${f.cantidadSugerida},${motivo},${diferencia},${f.estatus}\n`
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reporte_faltantes.csv"',
      },
    })
  } catch (error) {
    console.error('Error al exportar CSV:', error)
    return NextResponse.json({ error: 'Error al exportar el archivo.' }, { status: 500 })
  }
}