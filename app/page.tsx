'use client';

import { useState, useEffect } from 'react';

interface Faltante {
  id: number;
  producto: string;
  codigoSae?: string;
  codigoProv?: string;
  cantidadSugerida: number;
  motivo: 'NUEVO' | 'URGENTE' | 'ALTA_DEMANDA';
  diferenciaSae: boolean;
  estatus: 'PENDIENTE' | 'EN_PEDIDO' | 'RECIBIDO';
  fechaReporte: string;
  reportadoPor: {
    nombre: string;
  };
}

export default function Home() {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [producto, setProducto] = useState('');
  const [codigoSae, setCodigoSae] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<'NUEVO' | 'URGENTE' | 'ALTA_DEMANDA'>('ALTA_DEMANDA');
  const [diferenciaSae, setDiferenciaSae] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarFaltantes = async () => {
    try {
      const res = await fetch('/api/faltantes');
      const data = await res.json();
      if (Array.isArray(data)) setFaltantes(data);
    } catch (error) {
      console.error('Error al cargar faltantes', error);
    }
  };

  useEffect(() => {
    cargarFaltantes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !cantidad) {
      alert('Por favor escribe el nombre del producto y la cantidad.');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/faltantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto,
          codigoSae,
          codigoProv,
          cantidadSugerida: parseFloat(cantidad),
          motivo,
          diferenciaSae,
        }),
      });

      if (res.ok) {
        setProducto('');
        setCodigoSae('');
        setCodigoProv('');
        setCantidad('');
        setMotivo('ALTA_DEMANDA');
        setDiferenciaSae(false);
        setMensaje('¡Faltante registrado con éxito!');
        cargarFaltantes();
      } else {
        setMensaje('Error al registrar el faltante.');
      }
    } catch (error) {
      setMensaje('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">SUMIFEL - Control de Faltantes</h1>
          <p className="text-blue-100 text-sm mt-1">Gestión avanzada de inventario y abastecimiento</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reportar Nuevo Faltante</h2>
          
          {mensaje && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Descripción del Producto *</label>
              <input
                type="text"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Cable Kobrex calibre 12"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código en SAE 10</label>
                <input
                  type="text"
                  value={codigoSae}
                  onChange={(e) => setCodigoSae(e.target.value)}
                  placeholder="Ej. CABLE12"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Proveedor (Texto Libre)</label>
                <input
                  type="text"
                  value={codigoProv}
                  onChange={(e) => setCodigoProv(e.target.value)}
                  placeholder="Ej. KOB-12 (Como viene en etiqueta)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Sugerida *</label>
                <input
                  type="number"
                  step="any"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del Faltante</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
                >
                  <option value="ALTA_DEMANDA">🔥 Alta Demanda</option>
                  <option value="URGENTE">🚨 Pedido Urgente</option>
                  <option value="NUEVO">✨ Producto Nuevo</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-6">
                <input
                  type="checkbox"
                  id="diferencia"
                  checked={diferenciaSae}
                  onChange={(e) => setDiferenciaSae(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="diferencia" className="text-xs font-medium text-yellow-900 cursor-pointer">
                  ⚠️ ¿Diferencia de inventario? (No hay físicamente, pero SAE 10 dice que sí)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition duration-200 shadow-md"
            >
              {cargando ? 'Guardando...' : 'Registrar Faltante'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Historial de Faltantes</h2>
            <a
              href="/api/faltantes/export"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
            >
              📥 Descargar Reporte en Excel (CSV)
            </a>
          </div>
          
          {faltantes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No hay faltantes registrados por el momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-100 text-gray-700 text-sm">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Códigos (SAE / Prov.)</th>
                    <th className="p-3">Cant.</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Estatus</th>
                    <th className="p-3">Alerta SAE</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-gray-800">
                  {faltantes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(item.fechaReporte).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium">{item.producto}</td>
                      <td className="p-3 text-xs text-gray-600">
                        <div>SAE: <span className="font-semibold">{item.codigoSae || 'N/A'}</span></div>
                        <div>Prov: <span className="font-semibold">{item.codigoProv || 'N/A'}</span></div>
                      </td>
                      <td className="p-3 font-bold">{item.cantidadSugerida}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.motivo === 'URGENTE' ? 'bg-purple-100 text-purple-700' :
                          item.motivo === 'NUEVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.motivo}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          item.estatus === 'PENDIENTE' ? 'bg-red-100 text-red-700' :
                          item.estatus === 'EN_PEDIDO' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.estatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {item.diferenciaSae ? (
                          <span className="text-yellow-600 font-bold text-xs" title="Diferencia con SAE">⚠️ Sí</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}