'use client';

import { useState, useEffect } from 'react';

interface Faltante {
  id: number;
  fechaRegistro: string;
  producto: string;
  codigoSae: string | null;
  codigoProv: string | null;
  marca: string | null;
  proveedorSugerido: string | null;
  cantidadSugerida: number;
  motivo: string;
  diferenciaSae: string | null;
  estatus: string;
  reportadoPor: {
    id: number;
    nombre: string;
    rol: string;
  };
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

export default function FaltantesPage() {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroMotivo, setFiltroMotivo] = useState<string>('TODOS');
  const [filtroDiferenciaSae, setFiltroDiferenciaSae] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Estado para Nuevo Faltante
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({
    producto: '',
    codigoSae: '',
    codigoProv: '',
    marca: '',
    proveedorSugerido: '',
    cantidadSugerida: 1,
    motivo: 'Sin Existencias',
    diferenciaSae: '',
    usuarioId: '',
  });
  const [errorNuevo, setErrorNuevo] = useState('');
  const [successNuevo, setSuccessNuevo] = useState('');

  // Estado de Edición / Modal
  const [editingItem, setEditingItem] = useState<Faltante | null>(null);
  const [formValues, setFormValues] = useState({
    producto: '',
    codigoSae: '',
    codigoProv: '',
    marca: '',
    proveedorSugerido: '',
    cantidadSugerida: 0,
    motivo: '',
    diferenciaSae: '',
    estatus: '',
  });
  const [usuarioIdEdit, setUsuarioIdEdit] = useState<string>('');
  const [pinEdit, setPinEdit] = useState<string>('');
  const [errorModal, setErrorModal] = useState<string>('');
  const [successModal, setSuccessModal] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const resFaltantes = await fetch('/api/faltantes');
      const dataFaltantes = await resFaltantes.json();
      if (Array.isArray(dataFaltantes)) {
        setFaltantes(dataFaltantes);
      } else if (dataFaltantes.faltantes) {
        setFaltantes(dataFaltantes.faltantes);
      }

      const resUsuarios = await fetch('/api/usuarios');
      const dataUsuarios = await resUsuarios.json();
      if (Array.isArray(dataUsuarios)) {
        setUsuarios(dataUsuarios);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrarFaltante = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNuevo('');
    setSuccessNuevo('');

    if (!nuevoForm.usuarioId) {
      setErrorNuevo('Selecciona quién reporta.');
      return;
    }

    try {
      const res = await fetch('/api/faltantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoForm,
          cantidadSugerida: Number(nuevoForm.cantidadSugerida),
          usuarioId: Number(nuevoForm.usuarioId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar faltante');

      setSuccessNuevo('¡Faltante registrado con éxito!');
      setTimeout(() => {
        setShowNuevoModal(false);
        setNuevoForm({
          producto: '',
          codigoSae: '',
          codigoProv: '',
          marca: '',
          proveedorSugerido: '',
          cantidadSugerida: 1,
          motivo: 'Sin Existencias',
          diferenciaSae: '',
          usuarioId: '',
        });
        cargarDatos();
      }, 1000);
    } catch (err: any) {
      setErrorNuevo(err.message || 'Error al guardar');
    }
  };

  const abrirModalEdicion = (item: Faltante) => {
    setEditingItem(item);
    setFormValues({
      producto: item.producto || '',
      codigoSae: item.codigoSae || '',
      codigoProv: item.codigoProv || '',
      marca: item.marca || '',
      proveedorSugerido: item.proveedorSugerido || '',
      cantidadSugerida: item.cantidadSugerida || 0,
      motivo: item.motivo || '',
      diferenciaSae: item.diferenciaSae || '',
      estatus: item.estatus || 'PENDIENTE',
    });
    setUsuarioIdEdit('');
    setPinEdit('');
    setErrorModal('');
    setSuccessModal('');
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal('');
    setSuccessModal('');

    if (!usuarioIdEdit) {
      setErrorModal('Selecciona el usuario que autoriza.');
      return;
    }
    if (!pinEdit) {
      setErrorModal('Ingresa el PIN de autorización.');
      return;
    }

    try {
      const res = await fetch(`/api/faltantes/${editingItem?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formValues,
          usuarioId: Number(usuarioIdEdit),
          pin: pinEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar el registro');

      setSuccessModal('¡Registro actualizado correctamente con éxito!');
      setTimeout(() => {
        setEditingItem(null);
        cargarDatos();
      }, 1200);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al guardar cambios');
    }
  };

  // Dinámica de Filtros por Motivo y Diferencia SAE
  const motivosDisponibles = ['TODOS', ...Array.from(new Set(faltantes.map((f) => f.motivo).filter(Boolean)))];

  const faltantesFiltrados = faltantes.filter((item) => {
    const cumpleMotivo = filtroMotivo === 'TODOS' || item.motivo === filtroMotivo;
    const cumpleDiferencia =
      filtroDiferenciaSae === 'TODOS' ||
      (filtroDiferenciaSae === 'CON_DIFERENCIA' && item.diferenciaSae && item.diferenciaSae.trim() !== '') ||
      (filtroDiferenciaSae === 'SIN_DIFERENCIA' && (!item.diferenciaSae || item.diferenciaSae.trim() === ''));

    const textoBusqueda = busqueda.toLowerCase();
    const cumpleBusqueda =
      !busqueda ||
      item.producto.toLowerCase().includes(textoBusqueda) ||
      (item.codigoSae && item.codigoSae.toLowerCase().includes(textoBusqueda)) ||
      (item.marca && item.marca.toLowerCase().includes(textoBusqueda));

    return cumpleMotivo && cumpleDiferencia && cumpleBusqueda;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">SUMIFEL - Control de Faltantes</h1>
            <p className="text-gray-600 mt-1">Gestión y seguimiento de productos faltantes en sucursal con SAE 10.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Buscar producto, código, marca..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-64 bg-white text-black"
            />
            <button
              onClick={() => setShowNuevoModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow transition font-bold text-sm flex items-center gap-1.5"
            >
              <span>➕</span> Nuevo Faltante
            </button>
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition font-medium text-sm"
            >
              Actualizar
            </button>
          </div>
        </header>

        {/* Sección de Botones de Filtros por Motivo y Diferencia SAE */}
        <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filtrar por Motivo:</div>
            <div className="flex flex-wrap gap-2">
              {motivosDisponibles.map((motivo) => (
                <button
                  key={motivo}
                  onClick={() => setFiltroMotivo(motivo)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroMotivo === motivo
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {motivo}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diferencia SAE:</div>
            <div className="flex gap-2">
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: 'Con Diferencia SAE', value: 'CON_DIFERENCIA' },
                { label: 'Sin Diferencia SAE', value: 'SIN_DIFERENCIA' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFiltroDiferenciaSae(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    filtroDiferenciaSae === opt.value
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medium">Cargando registros...</div>
          ) : faltantesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">No se encontraron registros de faltantes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Producto / Marca</th>
                    <th className="p-4">Códigos</th>
                    <th className="p-4 text-center">Cant. Sug.</th>
                    <th className="p-4">Diferencia SAE</th>
                    <th className="p-4">Motivo</th>
                    <th className="p-4">Estatus</th>
                    <th className="p-4">Reportó</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {faltantesFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(item.fechaRegistro).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        <div>{item.producto}</div>
                        <div className="text-xs text-purple-600 font-semibold">Marca: {item.marca || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        <div><span className="font-semibold">SAE:</span> {item.codigoSae || 'N/A'}</div>
                        <div><span className="font-semibold">Prov:</span> {item.codigoProv || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-center font-bold text-gray-800">{item.cantidadSugerida}</td>
                      <td className="p-4">
                        {item.diferenciaSae ? (
                          <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                            {item.diferenciaSae}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Sin diferencia</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          {item.motivo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.estatus === 'PENDIENTE'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {item.estatus}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-600 font-medium">
                        {item.reportadoPor?.nombre || 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirModalEdicion(item)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow transition"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Nuevo Faltante */}
        {showNuevoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="bg-green-700 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>➕</span> Registrar Nuevo Faltante
                </h3>
                <button
                  onClick={() => setShowNuevoModal(false)}
                  className="text-green-200 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={registrarFaltante} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {errorNuevo && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{errorNuevo}</div>
                )}
                {successNuevo && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successNuevo}</div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre o Descripción del Producto *</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.producto}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, producto: e.target.value })}
                    placeholder="Ej. CABLE THW CAL 12 KOBREX"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código SAE 10</label>
                    <input
                      type="text"
                      value={nuevoForm.codigoSae}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, codigoSae: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código Proveedor</label>
                    <input
                      type="text"
                      value={nuevoForm.codigoProv}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, codigoProv: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Marca</label>
                    <input
                      type="text"
                      value={nuevoForm.marca}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, marca: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cantidad Sugerida *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={nuevoForm.cantidadSugerida}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, cantidadSugerida: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Motivo del Faltante</label>
                    <select
                      value={nuevoForm.motivo}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, motivo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                    >
                      <option value="Sin Existencias">Sin Existencias</option>
                      <option value="Stock Bajo">Stock Bajo</option>
                      <option value="Pedido Especial">Pedido Especial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reporta (Usuario) *</label>
                    <select
                      value={nuevoForm.usuarioId}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, usuarioId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.rol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diferencia SAE</label>
                  <input
                    type="text"
                    value={nuevoForm.diferenciaSae}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, diferenciaSae: e.target.value })}
                    placeholder="Ej. ¿Diferencia de inventario? (SAE 10 dice que sí hay)"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-black"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowNuevoModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow transition"
                  >
                    Guardar Faltante
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edición Protegida con PIN */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>✏️</span> Modificar Registro Faltante (#{editingItem.id})
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={guardarEdicion} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {errorModal && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {errorModal}
                  </div>
                )}
                {successModal && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                    {successModal}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre o Descripción del Producto *</label>
                  <input
                    type="text"
                    required
                    value={formValues.producto}
                    onChange={(e) => setFormValues({ ...formValues, producto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código SAE 10</label>
                    <input
                      type="text"
                      value={formValues.codigoSae}
                      onChange={(e) => setFormValues({ ...formValues, codigoSae: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código Proveedor</label>
                    <input
                      type="text"
                      value={formValues.codigoProv}
                      onChange={(e) => setFormValues({ ...formValues, codigoProv: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Marca</label>
                    <input
                      type="text"
                      value={formValues.marca}
                      onChange={(e) => setFormValues({ ...formValues, marca: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cantidad Sugerida *</label>
                    <input
                      type="number"
                      required
                      value={formValues.cantidadSugerida}
                      onChange={(e) => setFormValues({ ...formValues, cantidadSugerida: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Motivo del Faltante</label>
                    <select
                      value={formValues.motivo}
                      onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      <option value="Sin Existencias">Sin Existencias</option>
                      <option value="Stock Bajo">Stock Bajo</option>
                      <option value="Pedido Especial">Pedido Especial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estatus</label>
                    <select
                      value={formValues.estatus}
                      onChange={(e) => setFormValues({ ...formValues, estatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="SURTIDO">SURTIDO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diferencia SAE</label>
                  <input
                    type="text"
                    value={formValues.diferenciaSae}
                    onChange={(e) => setFormValues({ ...formValues, diferenciaSae: e.target.value })}
                    placeholder="Ej. ¿Diferencia de inventario? (SAE 10 dice que sí hay)"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  />
                </div>

                <hr className="my-2" />

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Autorización Requerida (Admin / Gerencia)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Autoriza:</label>
                      <select
                        value={usuarioIdEdit}
                        onChange={(e) => setUsuarioIdEdit(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre} ({u.rol})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PIN de Acceso:</label>
                      <input
                        type="password"
                        placeholder="PIN"
                        value={pinEdit}
                        onChange={(e) => setPinEdit(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
