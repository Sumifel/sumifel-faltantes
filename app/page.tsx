'use client';

import React, { useState } from 'react';

export default function SumifelFaltantes() {
  // Estado inicial de los faltantes con soporte para códigos Aspel SAE 10
  const [items, setItems] = useState([
    {
      id: 1,
      codigoSae: "SAE-1025",
      descripcion: "Cable THW Calibre 12 Kobrex",
      marca: "Kobrex",
      proveedor: "UNIT Electronics",
      cantidad: 5,
      fecha: "2026-08-01",
      estatus: "Pendiente",
      observaciones: "Falta en mostrador principal"
    },
    {
      id: 2,
      codigoSae: "SAE-2041",
      descripcion: "Pastilla Termomagnética 2x30A Siemens",
      marca: "Siemens",
      proveedor: "Geek Factory",
      cantidad: 2,
      fecha: "2026-08-03",
      estatus: "En Proceso",
      observaciones: "Pedido solicitado al proveedor"
    }
  ]);

  // Estados para los filtros avanzados
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Control de Autorización Gerencial (PIN)
  const [autorizadoGerencia, setAutorizadoGerencia] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleVerificarPin = () => {
    if (pinInput === '1234') { // Puedes ajustar tu PIN gerencial aquí
      setAutorizadoGerencia(true);
      setShowPinModal(false);
      setPinInput('');
      alert('Autorización gerencial concedida.');
    } else {
      alert('PIN incorrecto.');
    }
  };

  // Función para actualizar el estatus de manera inmediata en la interfaz
  const cambiarEstatus = (id, nuevoEstatus) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, estatus: nuevoEstatus };
      }
      return item;
    }));
  };

  // Lógica de filtrado robusta evaluando todas las variables
  const itemsFiltrados = items.filter(item => {
    const cumpleEstatus = filtroEstatus ? item.estatus === filtroEstatus : true;
    const cumpleMarca = filtroMarca 
      ? item.marca.toLowerCase().includes(filtroMarca.toLowerCase()) 
      : true;
    const cumpleProveedor = filtroProveedor 
      ? item.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) 
      : true;
    const cumpleFechaInicio = filtroFechaInicio ? item.fecha >= filtroFechaInicio : true;
    const cumpleFechaFin = filtroFechaFin ? item.fecha <= filtroFechaFin : true;

    return cumpleEstatus && cumpleMarca && cumpleProveedor && cumpleFechaInicio && cumpleFechaFin;
  });

  // Función para exportar a CSV respetando los filtros activos
  const exportarCSV = () => {
    const headers = ["ID,Codigo SAE,Descripcion,Marca,Proveedor,Cantidad,Fecha,Estatus,Observaciones\n"];
    const rows = itemsFiltrados.map(i => 
      `"${i.id}","${i.codigoSae}","${i.descripcion}","${i.marca}","${i.proveedor}","${i.cantidad}","${i.fecha}","${i.estatus}","${i.observaciones}"`
    );
    const blob = new Blob([...headers, rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `faltantes_sumifel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-xl shadow-md my-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SUMIFEL - Control de Faltantes (Aspel SAE 10)</h1>
          <p className="text-sm text-gray-500">Gestión operativa de inventario, estatus y filtros avanzados</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!autorizadoGerencia ? (
            <button 
              onClick={() => setShowPinModal(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
            >
              Modo Gerencia (PIN)
            </button>
          ) : (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold flex items-center">
              ✓ Gerencia Autorizada
            </span>
          )}
          <button 
            onClick={exportarCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Exportar CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* Panel de Filtros Interactivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Estatus</label>
          <select 
            value={filtroEstatus} 
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Todos los estatus</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Resuelto">Resuelto</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Marca</label>
          <input 
            type="text" 
            placeholder="Filtrar marca..." 
            value={filtroMarca} 
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Proveedor</label>
          <input 
            type="text" 
            placeholder="Filtrar proveedor..." 
            value={filtroProveedor} 
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Desde Fecha</label>
          <input 
            type="date" 
            value={filtroFechaInicio} 
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta Fecha</label>
          <input 
            type="date" 
            value={filtroFechaFin} 
            onChange={(e) => setFiltroFechaFin(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
              <th className="p-3 border-b">Código SAE 10</th>
              <th className="p-3 border-b">Descripción</th>
              <th className="p-3 border-b">Marca</th>
              <th className="p-3 border-b">Proveedor</th>
              <th className="p-3 border-b">Cant.</th>
              <th className="p-3 border-b">Fecha</th>
              <th className="p-3 border-b">Estatus Actual</th>
              <th className="p-3 border-b">Control / Cambiar Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {itemsFiltrados.length > 0 ? (
              itemsFiltrados.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-mono font-medium text-blue-600">{item.codigoSae}</td>
                  <td className="p-3">{item.descripcion}</td>
                  <td className="p-3">{item.marca}</td>
                  <td className="p-3">{item.proveedor}</td>
                  <td className="p-3 font-semibold">{item.cantidad}</td>
                  <td className="p-3 text-gray-500">{item.fecha}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.estatus === 'Pendiente' ? 'bg-red-100 text-red-800' :
                      item.estatus === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.estatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.estatus} 
                      onChange={(e) => {
                        // Opcional: Proteger estatus críticos con PIN
                        if (!autorizadoGerencia && e.target.value === 'Resuelto') {
                          setShowPinModal(true);
                          return;
                        }
                        cambiarEstatus(item.id, e.target.value);
                      }}
                      className="border rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400">
                  No hay registros que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de PIN */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2 text-gray-800">Autorización Requerida</h3>
            <p className="text-xs text-gray-500 mb-4">Ingresa el PIN gerencial para desbloquear acciones administrativas y cambios de estatus.</p>
            <input 
              type="password" 
              placeholder="PIN (ej. 1234)" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleVerificarPin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Autorizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//prueba