import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const faltantes = await prisma.faltante.findMany({
      orderBy: { fechaReporte: 'desc' },
      include: { reportadoPor: true },
    })

    // Encabezados del CSV (puedes abrirlos directo en Excel)
    let csv = 'ID,Producto,Codigo SAE,Cantidad Sugerida,Diferencia SAE,Estatus,Fecha\n'

    faltantes.forEach((f) => {
      const producto = `"${f.producto.replace(/"/g, '""')}"`
      const codigoSae = `"${f.codigoSae || ''}"`
      const diferencia = f.diferenciaSae ? 'SÍ' : 'NO'
      const fecha = new Date(f.fechaReporte).toLocaleString()
      
      csv += `${f.id},${producto},${codigoSae},${f.cantidadSugerida},${diferencia},${f.estatus},"${fecha}"\n`
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