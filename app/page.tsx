'use client';

import { useState, useEffect } from 'react';

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

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
    id: number;
    nombre: string;
  };
}

export default function Home() {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  // Campos del formulario
  const [producto, setProducto] = useState('');
  const [codigoSae, setCodigoSae] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<'NUEVO' | 'URGENTE' | 'ALTA_DEMANDA'>('ALTA_DEMANDA');
  const [diferenciaSae, setDiferenciaSae] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');

  // Filtros y estados visuales
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('TODOS');
  const [filtroAlerta, setFiltroAlerta] = useState<string>('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('TODOS');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      const res = await fetch('/api/faltantes');
      const data = await res.json();
      if (data.faltantes) setFaltantes(data.faltantes);
      if (data.usuarios) setUsuarios(data.usuarios);
    } catch (error) {
      console.error('Error al cargar datos', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !cantidad || !usuarioId) {
      alert('Por favor complete los campos obligatorios y seleccione quién reporta.');
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
          usuarioId: parseInt(usuarioId),
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
        cargarDatos();
      } else {
        setMensaje('Error al registrar el faltante.');
      }
    } catch (error) {
      setMensaje('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstatus = async (id: number, nuevoEstatus: string) => {
    try {
      const res = await fetch(`/api/faltantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });

      if (res.ok) {
        setFaltantes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, estatus: nuevoEstatus as any } : item
          )
        );
      } else {
        alert('No se pudo cambiar el estatus.');
      }
    } catch (error) {
      console.error('Error al cambiar estatus:', error);
    }
  };

  // Filtrado completo (estatus, motivo, alerta sae, usuario)
  const faltantesFiltrados = faltantes.filter((item) => {
    const pasaEstatus = filtroEstatus === 'TODOS' || item.estatus === filtroEstatus;
    const pasaMotivo = filtroMotivo === 'TODOS' || item.motivo === filtroMotivo;
    const pasaAlerta = 
      filtroAlerta === 'TODOS' || 
      (filtroAlerta === 'SI' && item.diferenciaSae) || 
      (filtroAlerta === 'NO' && !item.diferenciaSae);
    const pasaUsuario = 
      filtroUsuario === 'TODOS' || 
      item.reportadoPor?.id.toString() === filtroUsuario;

    return pasaEstatus && pasaMotivo && pasaAlerta && pasaUsuario;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md mb-6 print:bg-none print:text-black print:p-2">
          <h1 className="text-2xl md:text-3xl font-bold">SUMIFEL - Control de Faltantes</h1>
          <p className="text-blue-100 text-sm mt-1 print:hidden">Gestión avanzada de inventario y abastecimiento</p>
        </div>

        {/* Formulario (Oculto al imprimir PDF) */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 print:hidden">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reportar Nuevo Faltante</h2>
          
          {mensaje && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reportado por (Usuario) *</label>
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
                  required
                >
                  <option value="">Seleccione quién captura...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>
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
                  placeholder="Ej. KOB-12"
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

        {/* Historial y Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
            <h2 className="text-lg font-semibold text-gray-800">Historial de Faltantes</h2>
            
            {/* Botones de Exportación / Impresión */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
              >
                🖨️ Generar Reporte PDF
              </button>
              <a
                href="/api/faltantes/export"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
              >
                📥 Descargar Excel (CSV)
              </a>
            </div>
          </div>

          {/* Panel de Filtros Avanzados */}
          <div className="flex flex-col gap-3 mb-6 print:hidden bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Filtro por Estatus */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Estatus:</span>
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: '🔴 Pendientes', value: 'PENDIENTE' },
                { label: '🟡 En Pedido', value: 'EN_PEDIDO' },
                { label: '🟢 Recibidos', value: 'RECIBIDO' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltroEstatus(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroEstatus === tab.value
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro por Motivo */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Motivo:</span>
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: '✨ Nuevos', value: 'NUEVO' },
                { label: '🚨 Urgentes', value: 'URGENTE' },
                { label: '🔥 Alta Demanda', value: 'ALTA_DEMANDA' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltroMotivo(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroMotivo === tab.value
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro por Alerta SAE */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Alerta SAE:</span>
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: '⚠️ Con Diferencia', value: 'SI' },
                { label: '✔️ Sin Diferencia', value: 'NO' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltroAlerta(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroAlerta === tab.value
                      ? 'bg-yellow-600 text-white shadow'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro por Usuario (Reportado por) */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Reportado Por:</span>
              <button
                onClick={() => setFiltroUsuario('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filtroUsuario === 'TODOS'
                    ? 'bg-gray-800 text-white shadow'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos
              </button>
              {usuarios.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setFiltroUsuario(u.id.toString())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroUsuario === u.id.toString()
                      ? 'bg-gray-800 text-white shadow'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>
          
          {faltantesFiltrados.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No hay faltantes registrados con los filtros seleccionados.</p>
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
                    <th className="p-3">Capturado Por</th>
                    <th className="p-3">Estatus (Control)</th>
                    <th className="p-3">Alerta SAE</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-gray-800">
                  {faltantesFiltrados.map((item) => (
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
                      <td className="p-3 text-xs font-medium text-gray-700">
                        {item.reportadoPor?.nombre || 'General'}
                      </td>
                      <td className="p-3">
                        {/* Selector interactivo para cambiar estatus */}
                        <select
                          value={item.estatus}
                          onChange={(e) => cambiarEstatus(item.id, e.target.value)}
                          className={`p-1.5 rounded text-xs font-bold border focus:outline-none print:border-none print:bg-transparent ${
                            item.estatus === 'PENDIENTE' ? 'bg-red-50 text-red-700 border-red-300' :
                            item.estatus === 'EN_PEDIDO' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                            'bg-green-50 text-green-700 border-green-300'
                          }`}
                        >
                          <option value="PENDIENTE">🔴 PENDIENTE</option>
                          <option value="EN_PEDIDO">🟡 EN PEDIDO</option>
                          <option value="RECIBIDO">🟢 RECIBIDO</option>
                        </select>
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