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
      cantidadSugerida,
      motivo,
      alertaSaes,
      reportadoPorId,
    } = body;

    const finalCantidadSugerida = Number(cantidadSugerida ?? cantidad) || 1;

    const dataToCreate: any = {
      codigoSae: codigoSae || null,
      codigoProveedor: codigoProveedor || null,
      marca: marca || null,
      proveedorSugerido: proveedorSugerido ? String(proveedorSugerido) : null,
      cantidadSugerida: finalCantidadSugerida,
      motivo: motivo || 'Alta Demanda',
      alertaSaes: Boolean(alertaSaes),
    };

    if (descripcion !== undefined) dataToCreate.descripcion = descripcion;
    if (nombre !== undefined) dataToCreate.nombre = nombre;
    if (producto !== undefined) dataToCreate.producto = producto;

    // Conexión correcta de la relación en Prisma
    if (reportadoPorId) {
      dataToCreate.reportadoPor = {
        connect: { id: Number(reportadoPorId) }
      };
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