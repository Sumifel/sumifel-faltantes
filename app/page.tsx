<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
  <div>
    <h2 className="text-lg font-semibold text-gray-800">Historial de Faltantes</h2>
    {!puedeModificar ? (
      <p className="text-xs text-orange-600 font-medium mt-0.5">
        🔒 Modo Consulta ({usuarioActual?.nombre}). Para modificar estatus, seleccione Gerencia o Admin arriba e ingrese su PIN.
      </p>
    ) : (
      <p className="text-xs text-green-600 font-bold mt-0.5">
        🔓 Modo Gerencia / Admin Activo ({usuarioActual?.nombre}) - Modificación de estatus habilitada.
      </p>
    )}
  </div>
  
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => window.print()}
      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
    >
      🖨️ Generar Reporte PDF
    </button>
    <a
      href={`/api/faltantes/export?busqueda=${encodeURIComponent(busquedaTexto)}&estatus=${filtroEstatus}&motivo=${filtroMotivo}&alerta=${filtroAlerta}&usuarioId=${filtroUsuario}`}
      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
    >
      📥 Descargar Excel (CSV)
    </a>
  </div>
</div>