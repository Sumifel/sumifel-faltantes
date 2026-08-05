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

  // Sesión activa
  const [usuarioActivoId, setUsuarioActivoId] = useState<string>('');

  // Formulario de Nuevo Faltante
  const [nuevoForm, setNuevoForm] = useState({
    producto: '',
    codigoSae: '',
    codigoProv: '',
    marca: '',
    proveedorSugerido: '',
    cantidadSugerida: 1,
    motivo: 'Sin Existencias',
    tieneDiferenciaSae: false,
    diferenciaSaeTexto: '',
  });
  const [errorNuevo, setErrorNuevo] = useState('');
  const [successNuevo, setSuccessNuevo] = useState('');

  // Filtros del Historial (exactos a tu diseño)
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('TODOS');
  const [filtroDiferencia, setFiltroDiferencia] = useState<string>('TODOS');
  const [filtroReportadoPor, setFiltroReportadoPor] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal de Edición con PIN
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

  const usuarioActivoObj = usuarios.find((u) => u.id.toString() === usuarioActivoId);
  const esAdminOGerencia = usuarioActivoObj && ['Administrador', 'Gerente', 'Admin'].includes(usuarioActivoObj.rol);

  const registrarFaltante = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNuevo('');
    setSuccessNuevo('');

    if (!usuarioActivoId) {
      setErrorNuevo('Por favor selecciona quién está usando el sistema arriba a la derecha.');
      return;
    }

    try {
      const diffValue = nuevoForm.tieneDiferenciaSae ? (nuevoForm.diferenciaSaeTexto || 'Sí hay en SAE 10') : null;

      const res = await fetch('/api/faltantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto: nuevoForm.producto,
          codigoSae: nuevoForm.codigoSae,
          codigoProv: nuevoForm.codigoProv,
          marca: nuevoForm.marca,
          proveedorSugerido: nuevoForm.proveedorSugerido,
          cantidadSugerida: Number(nuevoForm.cantidadSugerida),
          motivo: nuevoForm.motivo,
          diferenciaSae: diffValue,
          usuarioId: Number(usuarioActivoId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar faltante');

      setSuccessNuevo('¡Faltante registrado con éxito!');
      setNuevoForm({
        producto: '',
        codigoSae: '',
        codigoProv: '',
        marca: '',
        proveedorSugerido: '',
        cantidadSugerida: 1,
        motivo: 'Sin Existencias',
        tieneDiferenciaSae: false,
        diferenciaSaeTexto: '',
      });
      cargarDatos();
      setTimeout(() => setSuccessNuevo(''), 3000);
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
    setPinEdit('');
    setErrorModal('');
    setSuccessModal('');
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal('');
    setSuccessModal('');

    if (!usuarioActivoId) {
      setErrorModal('Selecciona quién está usando el sistema arriba.');
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
          usuarioId: Number(usuarioActivoId),
          pin: pinEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar el registro');

      setSuccessModal('¡Registro actualizado correctamente!');
      setTimeout(() => {
        setEditingItem(null);
        cargarDatos();
      }, 1200);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al guardar cambios');
    }
  };

  // Filtrado de Faltantes
  const faltantesFiltrados = faltantes.filter((item) => {
    // Estatus
    const estatusUpper = (item.estatus || '').toUpperCase();
    const cumpleEstatus =
      filtroEstatus === 'TODOS' ||
      (filtroEstatus === 'PENDIENTES' && estatusUpper === 'PENDIENTE') ||
      (filtroEstatus === 'EN_PEDIDO' && (estatusUpper === 'EN_PEDIDO' || estatusUpper === 'PEDIDO')) ||
      (filtroEstatus === 'RECIBIDOS' && (estatusUpper === 'RECIBIDO' || estatusUpper === 'SURTIDO'));

    // Motivo
    const cumpleMotivo =
      filtroMotivo === 'TODOS' ||
      item.motivo.toLowerCase() === filtroMotivo.toLowerCase();

    // Alerta SAE
    const tieneDiff = item.diferenciaSae && item.diferenciaSae.trim() !== '';
    const cumpleDiferencia =
      filtroDiferencia === 'TODOS' ||
      (filtroDiferencia === 'CON_DIFERENCIA' && tieneDiff) ||
      (filtroDiferencia === 'SIN_DIFERENCIA' && !tieneDiff);

    // Reportado por
    const cumpleReportado =
      filtroReportadoPor === 'TODOS' ||
      item.reportadoPor?.id.toString() === filtroReportadoPor;

    // Búsqueda general
    const textoBusqueda = busqueda.toLowerCase();
    const cumpleBusqueda =
      !busqueda ||
      item.producto.toLowerCase().includes(textoBusqueda) ||
      (item.codigoSae && item.codigoSae.toLowerCase().includes(textoBusqueda)) ||
      (item.marca && item.marca.toLowerCase().includes(textoBusqueda)) ||
      (item.proveedorSugerido && item.proveedorSugerido.toLowerCase().includes(textoBusqueda));

    return cumpleEstatus && cumpleMotivo && cumpleDiferencia && cumpleReportado && cumpleBusqueda;
  });

  const generarPDF = () => {
    window.print();
  };

  const exportarCSV = () => {
    const headers = ['ID', 'Fecha', 'Producto', 'Codigo SAE', 'Codigo Prov', 'Marca', 'Proveedor Sugerido', 'Cant. Sug.', 'Motivo', 'Diferencia SAE', 'Estatus', 'Reportado Por'];
    const rows = faltantesFiltrados.map(f => [
      f.id,
      f.fechaRegistro,
      `"${f.producto}"`,
      f.codigoSae || '',
      f.codigoProv || '',
      f.marca || '',
      `"${f.proveedorSugerido || ''}"`,
      f.cantidadSugerida,
      `"${f.motivo}"`,
      `"${f.diferenciaSae || ''}"`,
      f.estatus,
      `"${f.reportadoPor?.nombre || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_faltantes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Principal */}
        <header className="bg-blue-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">SUMIFEL - Control de Faltantes</h1>
            <p className="text-blue-100 text-sm mt-1">Gestión avanzada de inventario y abastecimiento</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 w-full md:w-auto">
            <label className="block text-xs font-bold text-blue-100 uppercase mb-1">
              👤 ¿Quién está usando el sistema ahora?
            </label>
            <select
              value={usuarioActivoId}
              onChange={(e) => setUsuarioActivoId(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-white text-black font-semibold rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Seleccione usuario activo...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Sección: Reportar Nuevo Faltante (Directo en pantalla) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Reportar Nuevo Faltante</h2>

          <form onSubmit={registrarFaltante} className="space-y-4">
            {errorNuevo && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                {errorNuevo}
              </div>
            )}
            {successNuevo && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-medium">
                {successNuevo}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nombre o Descripción del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoForm.producto}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, producto: e.target.value })}
                  placeholder="Ej. Cable Kobrex calibre 12"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reportado por (Usuario) *
                </label>
                <select
                  value={usuarioActivoId}
                  onChange={(e) => setUsuarioActivoId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Código en SAE 10
                </label>
                <input
                  type="text"
                  value={nuevoForm.codigoSae}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, codigoSae: e.target.value })}
                  placeholder="Ej. CABLE12"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Código de Proveedor (Libre)
                </label>
                <input
                  type="text"
                  value={nuevoForm.codigoProv}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, codigoProv: e.target.value })}
                  placeholder="Ej. KOB-12"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={nuevoForm.marca}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, marca: e.target.value })}
                  placeholder="Ej. Kobrex, Siemens..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Proveedor Sugerido
                </label>
                <input
                  type="text"
                  value={nuevoForm.proveedorSugerido}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, proveedorSugerido: e.target.value })}
                  placeholder="Ej. Distribuidor Electrico SA"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Cantidad Sugerida *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={nuevoForm.cantidadSugerida}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, cantidadSugerida: Number(e.target.value) })}
                  placeholder="Ej. 5"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Motivo del Faltante
                </label>
                <select
                  value={nuevoForm.motivo}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium"
                >
                  <option value="Sin Existencias">⚠️ Sin Existencias</option>
                  <option value="Nuevos">✨ Nuevos</option>
                  <option value="Urgentes">🚨 Urgentes</option>
                  <option value="Alta Demanda">🔥 Alta Demanda</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition mt-5">
                  <input
                    type="checkbox"
                    checked={nuevoForm.tieneDiferenciaSae}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, tieneDiferenciaSae: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    ⚠️ ¿Diferencia de inventario? (SAE dice que sí hay)
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition text-base"
            >
              Registrar Faltante
            </button>
          </form>
        </section>

        {/* Sección: Historial de Faltantes */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Historial de Faltantes</h2>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                🔒 Modo Consulta {usuarioActivoObj ? `(${usuarioActivoObj.nombre})` : ''}. Para modificar estatus, seleccione Gerencia o Admin arriba e ingrese su PIN.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white w-48"
              />
              <button
                onClick={generarPDF}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
              >
                🖨️ Generar Reporte PDF
              </button>
              <button
                onClick={exportarCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
              >
                📥 Descargar Excel Filtrado (CSV)
              </button>
            </div>
          </div>

          {/* Panel de Filtros Exacto */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs font-bold">
            {/* Estatus */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-500 uppercase w-32">ESTATUS:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Todos', value: 'TODOS' },
                  { label: 'Pendientes', value: 'PENDIENTES' },
                  { label: 'En Pedido', value: 'EN_PEDIDO' },
                  { label: 'Recibidos', value: 'RECIBIDOS' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFiltroEstatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filtroEstatus === opt.value ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-500 uppercase w-32">MOTIVO:</span>
              <div className="flex flex-wrap gap-2">
                {['TODOS', 'Sin Existencias', 'Nuevos', 'Urgentes', 'Alta Demanda'].map((mot) => (
                  <button
                    key={mot}
                    onClick={() => setFiltroMotivo(mot)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filtroMotivo === mot ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {mot === 'TODOS' ? 'Todos' : mot}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerta SAE */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-500 uppercase w-32">ALERTA SAE:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Todos', value: 'TODOS' },
                  { label: 'Con Diferencia', value: 'CON_DIFERENCIA' },
                  { label: 'Sin Diferencia', value: 'SIN_DIFERENCIA' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFiltroDiferencia(opt.value)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filtroDiferencia === opt.value ? 'bg-amber-600 text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reportado por */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-500 uppercase w-32">REPORTADO POR:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroReportadoPor('TODOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filtroReportadoPor === 'TODOS' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                {usuarios.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setFiltroReportadoPor(u.id.toString())}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filtroReportadoPor === u.id.toString() ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {u.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medium">Cargando historial...</div>
          ) : faltantesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">No hay faltantes registrados con los filtros seleccionados.</div>
          ) : (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Producto / Marca</th>
                    <th className="p-3">Códigos</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3">Diferencia SAE</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Estatus</th>
                    <th className="p-3">Reportó</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faltantesFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(item.fechaRegistro).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium text-gray-900">
                        <div>{item.producto}</div>
                        <div className="text-xs text-purple-600 font-semibold">Marca: {item.marca || 'N/A'}</div>
                        {item.proveedorSugerido && (
                          <div className="text-xs text-gray-500">Prov: {item.proveedorSugerido}</div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        <div><span className="font-semibold">SAE:</span> {item.codigoSae || 'N/A'}</div>
                        <div><span className="font-semibold">Prov:</span> {item.codigoProv || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-gray-800">{item.cantidadSugerida}</td>
                      <td className="p-3">
                        {item.diferenciaSae ? (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                            {item.diferenciaSae}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Sin diferencia</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          {item.motivo}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.estatus === 'PENDIENTE'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {item.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600 font-medium">
                        {item.reportadoPor?.nombre || 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => abrirModalEdicion(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow transition"
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
        </section>

        {/* Modal de Edición */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>✏️</span> Editar Registro Faltante (#{editingItem.id})
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
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código SAE 10</label>
                    <input
                      type="text"
                      value={formValues.codigoSae}
                      onChange={(e) => setFormValues({ ...formValues, codigoSae: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Código Proveedor</label>
                    <input
                      type="text"
                      value={formValues.codigoProv}
                      onChange={(e) => setFormValues({ ...formValues, codigoProv: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
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
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cantidad Sugerida *</label>
                    <input
                      type="number"
                      required
                      value={formValues.cantidadSugerida}
                      onChange={(e) => setFormValues({ ...formValues, cantidadSugerida: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Motivo</label>
                    <select
                      value={formValues.motivo}
                      onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="Sin Existencias">Sin Existencias</option>
                      <option value="Nuevos">Nuevos</option>
                      <option value="Urgentes">Urgentes</option>
                      <option value="Alta Demanda">Alta Demanda</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estatus</label>
                    <select
                      value={formValues.estatus}
                      onChange={(e) => setFormValues({ ...formValues, estatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold"
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
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Autorización Requerida</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Usuario Activo:</label>
                      <input
                        type="text"
                        disabled
                        value={usuarioActivoObj ? `${usuarioActivoObj.nombre} (${usuarioActivoObj.rol})` : 'Ninguno seleccionado arriba'}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-gray-100 font-bold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PIN de Acceso:</label>
                      <input
                        type="password"
                        placeholder="Ingrese PIN"
                        value={pinEdit}
                        onChange={(e) => setPinEdit(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
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