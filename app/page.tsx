const cambiarEstatus = async (id: number, nuevoEstatus: string) => {
    if (!esGerenteOAdmin) {
      alert('⛔ Acceso restringido: Solo el Gerente o el Administrador pueden cambiar el estatus de los pedidos.');
      cargarDatos(); // Recarga para revertir visualmente el select
      return;
    }

    // Pedir el PIN de seguridad al administrador/gerente
    const pinIngresado = prompt(`🔒 Acción protegida\nPor favor ingrese el PIN de seguridad de ${usuarioActual?.nombre}:`);
    
    if (pinIngresado === null) {
      // Si cancela, recargamos para que el select regrese a su valor original
      cargarDatos();
      return;
    }

    try {
      const res = await fetch(`/api/faltantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estatus: nuevoEstatus,
          usuarioId: parseInt(usuarioSesionId),
          pin: pinIngresado
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFaltantes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, estatus: nuevoEstatus as any } : item
          )
        );
      } else {
        alert(data.error || 'No se pudo cambiar el estatus.');
        cargarDatos(); // Revertir si el PIN fue incorrecto
      }
    } catch (error) {
      console.error('Error al cambiar estatus:', error);
      cargarDatos();
    }
  };