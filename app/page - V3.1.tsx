'use client';

import { useState, useEffect } from 'react';

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

type EstatusFaltante = 'PENDIENTE' | 'EN_PEDIDO' | 'RECIBIDO' | 'DESCARTADO' | 'DESCONTINUADO';
type MotivoFaltante = 'NUEVO' | 'URGENTE' | 'ALTA_DEMANDA' | 'SIN_EXISTENCIAS';

interface Faltante {
  id: number;
  producto: string;
  codigoSae?: string;
  codigoProv?: string;
  marca?: string;
  proveedorSugerido?: string;
  cantidadSugerida: number;
  motivo: MotivoFaltante;
  diferenciaSae: boolean;
  estatus: EstatusFaltante;
  fechaReporte: string;
  reportadoPor: {
    id: number;
    nombre: string;
  };
}

export default function Home() {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [usuarioSesionId, setUsuarioSesionId] = useState<string>('');
  
  const [pinGuardado, setPinGuardado] = useState<string>('');
  const [autorizadoGerencia, setAutorizadoGerencia] = useState<boolean>(false);

  // Estados para nuevo registro
  const [producto, setProducto] = useState('');
  const [codigoSae, setCodigoSae] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [marca, setMarca] = useState('');
  const [proveedorSugerido, setProveedorSugerido] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<MotivoFaltante>('SIN_EXISTENCIAS');
  const [diferenciaSae, setDiferenciaSae] = useState(false);
  const [usuarioReportaId, setUsuarioReportaId] = useState('');

  // Estados para edición en línea por renglón
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editProducto, setEditProducto] = useState('');
  const [editCodigoSae, setEditCodigoSae] = useState('');
  const [editCodigoProv, setEditCodigoProv] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editProveedorSugerido, setEditProveedorSugerido] = useState('');
  const [editCantidadSugerida, setEditCantidadSugerida] = useState('');
  const [editMotivo, setEditMotivo] = useState<MotivoFaltante>('SIN_EXISTENCIAS');
  const [editDiferenciaSae, setEditDiferenciaSae] = useState(false);

  // Filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('TODOS');
  const [filtroAlerta, setFiltroAlerta] = useState<string>('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('TODOS');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      const res = await fetch('/api/faltantes');
      const data = await res.json();
      if (data.faltantes) setFaltantes(data.faltantes);
      if (data.usuarios && data.usuarios.length > 0) {
        setUsuarios(data.usuarios);
        
        if (!usuarioSesionId) {
          const primerUsuario = data.usuarios[0];
          setUsuarioSesionId(primerUsuario.id.toString());
          
          if (primerUsuario.rol === 'ADMIN' || primerUsuario.rol === 'GERENCIA') {
            const pin = prompt(`🔒 Ingrese el PIN de seguridad de ${primerUsuario.nombre} para habilitar la edición:`);
            if (pin && pin.trim() !== '') {
              setPinGuardado(pin);
              setAutorizadoGerencia(true);
            } else {
              setPinGuardado('');
              setAutorizadoGerencia(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuarioActual = usuarios.find(u => u.id.toString() === usuarioSesionId);
  const esGerenteOAdmin = usuarioActual?.rol === 'ADMIN' || usuarioActual?.rol === 'GERENCIA';
  const puedeModificar = esGerenteOAdmin && autorizadoGerencia;

  const handleCambioUsuario = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoId = e.target.value;
    setUsuarioSesionId(nuevoId);
    setEditandoId(null);
    
    const user = usuarios.find(u => u.id.toString() === nuevoId);
    if (user && (user.rol === 'ADMIN' || user.rol === 'GERENCIA')) {
      const pin = prompt(`🔒 Ingrese el PIN de seguridad de ${user.nombre} para habilitar la edición:`);
      if (pin !== null && pin.trim() !== '') {
        setPinGuardado(pin);
        setAutorizadoGerencia(true);
      } else {
        setPinGuardado('');
        setAutorizadoGerencia(false);
        alert('Acceso de gerencia no autorizado. Quedará en modo consulta.');
      }
    } else {
      setPinGuardado('');
      setAutorizadoGerencia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !cantidad || !usuarioReportaId) {
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
          marca,
          proveedorSugerido,
          cantidadSugerida: parseFloat(cantidad),
          motivo,
          diferenciaSae,
          usuarioId: parseInt(usuarioReportaId),
        }),
      });

      if (res.ok) {
        setProducto('');
        setCodigoSae('');
        setCodigoProv('');
        setMarca('');
        setProveedorSugerido('');
        setCantidad('');
        setMotivo('SIN_EXISTENCIAS');
        setDiferenciaSae(false);
        setMensaje('¡Faltante registrado con éxito!');
        cargarDatos();
      } else {
        setMensaje('Error al registrar el faltante.');
      }
    } catch (error) {
      console.error('Error de conexión al registrar:', error);
      setMensaje('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstatus = async (id: number, nuevoEstatus: string) => {
    if (!puedeModificar) {
      alert('⛔ Acceso restringido: Debe seleccionar una cuenta de Gerencia o Administrador y haber ingresado su PIN.');
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
          pin: pinGuardado
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFaltantes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, estatus: nuevoEstatus as EstatusFaltante } : item
          )
        );
      } else {
        if (res.status === 401) {
          alert('PIN de seguridad incorrecto. Se cerrará el modo gerencia.');
          setAutorizadoGerencia(false);
          setPinGuardado('');
        } else {
          alert(data.error || 'No se pudo cambiar el estatus.');
        }
        cargarDatos();
      }
    } catch (error) {
      console.error('Error al cambiar estatus:', error);
      cargarDatos();
    }
  };

  const iniciarEdicion = (item: Faltante) => {
    if (!puedeModificar) {
      alert('⛔ Acceso restringido: Debe seleccionar una cuenta de Gerencia o Administrador y haber ingresado su PIN para editar registros.');
      return;
    }
    setEditandoId(item.id);
    setEditProducto(item.producto);
    setEditCodigoSae(item.codigoSae || '');
    setEditCodigoProv(item.codigoProv || '');
    setEditMarca(item.marca || '');
    setEditProveedorSugerido(item.proveedorSugerido || '');
    setEditCantidadSugerida(item.cantidadSugerida.toString());
    setEditMotivo(item.motivo);
    setEditDiferenciaSae(item.diferenciaSae);
  };

  const guardarEdicion = async (id: number) => {
    if (!editProducto || !editCantidadSugerida) {
      alert('El producto y la cantidad sugerida son obligatorios.');
      return;
    }

    try {
      const res = await fetch(`/api/faltantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto: editProducto,
          codigoSae: editCodigoSae,
          codigoProv: editCodigoProv,
          marca: editMarca,
          proveedorSugerido: editProveedorSugerido,
          cantidadSugerida: parseFloat(editCantidadSugerida),
          motivo: editMotivo,
          diferenciaSae: editDiferenciaSae,
          usuarioId: parseInt(usuarioSesionId),
          pin: pinGuardado
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFaltantes((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  producto: editProducto,
                  codigoSae: editCodigoSae,
                  codigoProv: editCodigoProv,
                  marca: editMarca,
                  proveedorSugerido: editProveedorSugerido,
                  cantidadSugerida: parseFloat(editCantidadSugerida),
                  motivo: editMotivo,
                  diferenciaSae: editDiferenciaSae,
                }
              : item
          )
        );
        setEditandoId(null);
      } else {
        if (res.status === 401) {
          alert('PIN de seguridad incorrecto. Se cerrará el modo gerencia.');
          setAutorizadoGerencia(false);
          setPinGuardado('');
        } else {
          alert(data.error || 'No se pudo actualizar el registro.');
        }
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error de conexión al actualizar.');
    }
  };

  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroEstatus('TODOS');
    setFiltroMotivo('TODOS');
    setFiltroAlerta('TODOS');
    setFiltroUsuario('TODOS');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const faltantesFiltrados = faltantes.filter((item) => {
    const texto = busquedaTexto.toLowerCase().trim();
    const pasaBusqueda = 
      !texto || 
      item.producto.toLowerCase().includes(texto) ||
      (item.codigoSae && item.codigoSae.toLowerCase().includes(texto)) ||
      (item.codigoProv && item.codigoProv.toLowerCase().includes(texto)) ||
      (item.marca && item.marca.toLowerCase().includes(texto)) ||
      (item.proveedorSugerido && item.proveedorSugerido.toLowerCase().includes(texto));

    const pasaEstatus = filtroEstatus === 'TODOS' || item.estatus === filtroEstatus;
    const pasaMotivo = filtroMotivo === 'TODOS' || item.motivo === filtroMotivo;
    const pasaAlerta = 
      filtroAlerta === 'TODOS' || 
      (filtroAlerta === 'SI' && item.diferenciaSae) || 
      (filtroAlerta === 'NO' && !item.diferenciaSae);
    const pasaUsuario = 
      filtroUsuario === 'TODOS' || 
      item.reportadoPor?.id.toString() === filtroUsuario;

    let pasaFecha = true;
    if (item.fechaReporte) {
      const fechaItemOnly = item.fechaReporte.split('T')[0];
      if (filtroFechaInicio && fechaItemOnly < filtroFechaInicio) {
        pasaFecha = false;
      }
      if (filtroFechaFin && fechaItemOnly > filtroFechaFin) {
        pasaFecha = false;
      }
    }

    return pasaBusqueda && pasaEstatus && pasaMotivo && pasaAlerta && pasaUsuario && pasaFecha;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">SUMIFEL - Control de Faltantes</h1>
            <p className="text-blue-100 text-sm mt-1">Gestión avanzada de inventario y abastecimiento (SAE 10)</p>
          </div>

          <div className="bg-blue-700 p-3 rounded-lg border border-blue-500 w-full md:w-auto">
            <label className="block text-xs font-semibold text-blue-200 mb-1">👤 ¿Quién está usando el sistema ahora?</label>
            <select
              value={usuarioSesionId}
              onChange={handleCambioUsuario}
              className="w-full md:w-64 p-2 bg-white text-black font-semibold rounded text-sm focus:outline-none"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol}) {u.rol === 'ADMIN' || u.rol === 'GERENCIA' ? '🔑 [Gerencia]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                  value={usuarioReportaId}
                  onChange={(e) => setUsuarioReportaId(e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Proveedor (Libre)</label>
                <input
                  type="text"
                  value={codigoProv}
                  onChange={(e) => setCodigoProv(e.target.value)}
                  placeholder="Ej. KOB-12"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej. Kobrex, Siemens..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor Sugerido</label>
                <input
                  type="text"
                  value={proveedorSugerido}
                  onChange={(e) => setProveedorSugerido(e.target.value)}
                  placeholder="Ej. Distribuidor Electrico SA"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del Faltante</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as MotivoFaltante)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
                >
                  <option value="SIN_EXISTENCIAS">⚠️ Sin Existencias</option>
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
                  ⚠️ ¿Diferencia de inventario? (SAE 10 dice que sí hay)
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
          <div className="hidden print:block mb-6 border-b-2 border-blue-600 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">SUMIFEL - Reporte de Control de Faltantes</h1>
            <div className="mt-2 text-sm text-gray-700 grid grid-cols-2 gap-2">
              <p>📅 <strong className="text-gray-900">Fecha de emisión:</strong> {new Date().toLocaleString()}</p>
              <p>👤 <strong className="text-gray-900">Impreso por:</strong> {usuarioActual ? `${usuarioActual.nombre} (${usuarioActual.rol})` : 'Sistema'}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Historial de Faltantes</h2>
              {!puedeModificar ? (
                <p className="text-xs text-orange-600 font-medium mt-0.5">
                  🔒 Modo Consulta ({usuarioActual?.nombre}). Para editar o cambiar estatus, seleccione Gerencia o Admin arriba e ingrese su PIN.
                </p>
              ) : (
                <p className="text-xs text-green-600 font-bold mt-0.5">
                  🔓 Modo Gerencia / Admin Activo ({usuarioActual?.nombre}) - Edición y estatus habilitados.
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
                href={`/api/faltantes/export?busqueda=${encodeURIComponent(busquedaTexto)}&estatus=${filtroEstatus}&motivo=${filtroMotivo}&alerta=${filtroAlerta}&usuarioId=${filtroUsuario}&fechaInicio=${filtroFechaInicio}&fechaFin=${filtroFechaFin}`}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm"
              >
                📥 Descargar Excel (CSV)
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6 print:hidden bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
              <div className="w-full md:w-2/3">
                <input
                  type="text"
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  placeholder="🔍 Buscar por producto, código SAE, proveedor, marca..."
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
                <span className="text-xs font-semibold text-gray-600">
                  Mostrando <strong className="text-blue-600">{faltantesFiltrados.length}</strong> de {faltantes.length} registros
                </span>
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition"
                >
                  🧹 Limpiar Filtros
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Rango de Fecha:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Desde:</span>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="p-1.5 bg-white border border-gray-300 rounded-lg text-xs text-black focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-500 font-semibold">Hasta:</span>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="p-1.5 bg-white border border-gray-300 rounded-lg text-xs text-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase w-32">Estatus:</span>
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: '🔴 Pendientes', value: 'PENDIENTE' },
                { label: '🟡 En Pedido', value: 'EN_PEDIDO' },
                { label: '🟢 Recibidos', value: 'RECIBIDO' },
                { label: '🟠 Descartados', value: 'DESCARTADO' },
                { label: '❌ Descontinuados', value: 'DESCONTINUADO' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltroEstatus(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtroEstatus === tab.value ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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
                    filtroAlerta === tab.value ? 'bg-yellow-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
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
                    <th className="p-3">Producto / Marca</th>
                    <th className="p-3">Códigos & Proveedor</th>
                    <th className="p-3">Cant.</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Capturado Por</th>
                    <th className="p-3">Estatus (Control)</th>
                    <th className="p-3">Alerta SAE</th>
                    <th className="p-3 text-center print:hidden">Acciones / Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-gray-800">
                  {faltantesFiltrados.map((item) => {
                    const estaEditando = editandoId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 text-xs text-gray-500">
                          {new Date(item.fechaReporte).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {estaEditando ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editProducto}
                                onChange={(e) => setEditProducto(e.target.value)}
                                placeholder="Producto"
                                className="w-full p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editMarca}
                                onChange={(e) => setEditMarca(e.target.value)}
                                placeholder="Marca"
                                className="w-full p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{item.producto}</div>
                              {item.marca && <div className="text-xs text-blue-600 font-semibold">Marca: {item.marca}</div>}
                            </>
                          )}
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {estaEditando ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editCodigoSae}
                                onChange={(e) => setEditCodigoSae(e.target.value)}
                                placeholder="Código SAE 10"
                                className="w-full p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editCodigoProv}
                                onChange={(e) => setEditCodigoProv(e.target.value)}
                                placeholder="Código Prov"
                                className="w-full p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editProveedorSugerido}
                                onChange={(e) => setEditProveedorSugerido(e.target.value)}
                                placeholder="Proveedor Sugerido"
                                className="w-full p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                              />
                            </div>
                          ) : (
                            <>
                              <div>SAE: <span className="font-semibold">{item.codigoSae || 'N/A'}</span></div>
                              <div>Prov: <span className="font-semibold">{item.codigoProv || 'N/A'}</span></div>
                              {item.proveedorSugerido && <div className="text-purple-700 font-semibold mt-0.5">Sug: {item.proveedorSugerido}</div>}
                            </>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          {estaEditando ? (
                            <input
                              type="number"
                              step="any"
                              value={editCantidadSugerida}
                              onChange={(e) => setEditCantidadSugerida(e.target.value)}
                              className="w-20 p-1.5 border border-blue-400 rounded text-xs text-black bg-white font-bold focus:outline-none"
                            />
                          ) : (
                            item.cantidadSugerida
                          )}
                        </td>
                        <td className="p-3">
                          {estaEditando ? (
                            <select
                              value={editMotivo}
                              onChange={(e) => setEditMotivo(e.target.value as MotivoFaltante)}
                              className="p-1.5 border border-blue-400 rounded text-xs text-black bg-white focus:outline-none"
                            >
                              <option value="SIN_EXISTENCIAS">⚠️ Sin Exist.</option>
                              <option value="ALTA_DEMANDA">🔥 Alta Demanda</option>
                              <option value="URGENTE">🚨 Urgente</option>
                              <option value="NUEVO">✨ Nuevo</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.motivo === 'URGENTE' ? 'bg-purple-100 text-purple-700' :
                              item.motivo === 'NUEVO' ? 'bg-blue-100 text-blue-700' :
                              item.motivo === 'SIN_EXISTENCIAS' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {item.motivo}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs font-medium text-gray-700">
                          {item.reportadoPor?.nombre || 'General'}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.estatus}
                            onChange={(e) => cambiarEstatus(item.id, e.target.value)}
                            disabled={!puedeModificar}
                            title={!puedeModificar ? "Debe seleccionar Gerencia/Admin arriba e ingresar el PIN" : "Cambiar estatus"}
                            className={`p-1.5 rounded text-xs font-bold border focus:outline-none ${
                              !puedeModificar ? 'opacity-75 cursor-not-allowed bg-gray-100' : 'cursor-pointer shadow-sm'
                            } ${
                              item.estatus === 'PENDIENTE' ? 'bg-red-50 text-red-700 border-red-300' :
                              item.estatus === 'EN_PEDIDO' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                              item.estatus === 'RECIBIDO' ? 'bg-green-50 text-green-700 border-green-300' :
                              item.estatus === 'DESCARTADO' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                              item.estatus === 'DESCONTINUADO' ? 'bg-gray-200 text-gray-800 border-gray-400' :
                              'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="PENDIENTE">🔴 PENDIENTE</option>
                            <option value="EN_PEDIDO">🟡 EN PEDIDO</option>
                            <option value="RECIBIDO">🟢 RECIBIDO</option>
                            <option value="DESCARTADO">🟠 DESCARTADO</option>
                            <option value="DESCONTINUADO">❌ DESCONTINUADO</option>
                          </select>
                        </td>
                        <td className="p-3">
                          {estaEditando ? (
                            <div className="flex items-center space-x-1 bg-yellow-50 p-1 rounded border border-yellow-200">
                              <input
                                type="checkbox"
                                checked={editDiferenciaSae}
                                onChange={(e) => setEditDiferenciaSae(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-[10px] font-bold text-yellow-900">Dif. SAE</span>
                            </div>
                          ) : (
                            item.diferenciaSae ? (
                              <span className="text-yellow-600 font-bold text-xs" title="Diferencia con SAE 10">⚠️ Sí</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          )}
                        </td>
                        <td className="p-3 text-center print:hidden">
                          {estaEditando ? (
                            <div className="flex flex-col gap-1 items-center">
                              <button
                                onClick={() => guardarEdicion(item.id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow transition"
                                title="Guardar cambios"
                              >
                                💾 Guardar
                              </button>
                              <button
                                onClick={() => setEditandoId(null)}
                                className="px-2.5 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-bold transition"
                                title="Cancelar"
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicion(item)}
                              disabled={!puedeModificar}
                              title={!puedeModificar ? "Requiere Gerencia/Admin y PIN para editar" : "Editar campos de este registro"}
                              className={`px-3 py-1.5 rounded text-xs font-bold transition shadow ${
                                !puedeModificar
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              ✏️ Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="w-full text-center py-6 mt-8 border-t border-gray-200 text-xs font-semibold text-gray-500 print:mt-4">
        JALONEME LABS 2026 - SUMIFEL
      </footer>
    </main>
  );
}