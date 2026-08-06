import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ajusta según tu ruta de importación de Prisma

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { usuarioId, pin, estatus, producto, ...datosActualizacion } = body;

    if (!usuarioId) {
      return NextResponse.json({ error: 'Falta el ID del usuario en sesión.' }, { status: 400 });
    }

    // 1. Buscar al usuario en la base de datos para verificar sus privilegios y su PIN real
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // 2. Verificar que sea ADMIN o GERENCIA
    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'GERENCIA') {
      return NextResponse.json({ error: 'Acceso restringido a Gerencia o Administrador.' }, { status: 403 });
    }

    // 3. Validar estrictamente el PIN contra el registro de la base de datos
    // Nota: Si en tu base de datos el campo se llama 'password' o 'clave', cambia 'usuario.pin' por el nombre correcto de tu columna.
    if (!pin || pin !== usuario.pin) {
      return NextResponse.json({ error: 'PIN de seguridad incorrecto.' }, { status: 401 });
    }

    // 4. Si el PIN es correcto, procedemos a construir los datos a actualizar
    const dataToUpdate: any = {};
    if (estatus) dataToUpdate.estatus = estatus;
    if (producto) {
      dataToUpdate.producto = producto;
      dataToUpdate.codigoSae = datosActualizacion.codigoSae;
      dataToUpdate.codigoProv = datosActualizacion.codigoProv;
      dataToUpdate.marca = datosActualizacion.marca;
      dataToUpdate.proveedorSugerido = datosActualizacion.proveedorSugerido;
      dataToUpdate.cantidadSugerida = datosActualizacion.cantidadSugerida;
      dataToUpdate.motivo = datosActualizacion.motivo;
      dataToUpdate.diferenciaSae = datosActualizacion.diferenciaSae;
    }

    const faltanteActualizado = await prisma.faltante.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Actualización realizada con éxito', 
      faltante: faltanteActualizado 
    });

  } catch (error) {
    console.error('Error en PATCH /api/faltantes/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}