'use client';

import React, { useState, useEffect } from 'react';

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

export default function RegistroFaltanteForm() {
  // Estados del formulario
  const [producto, setProducto] = useState('');
  const [codigoSae, setCodigoSae] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [marca, setMarca] = useState('');
  const [proveedorSugerido, setProveedorSugerido] = useState('');
  const [cantidadSugerida, setCantidadSugerida] = useState(1);
  const [motivo, setMotivo] = useState('SIN_EXISTENCIAS');
  const [diferenciaSae, setDiferenciaSae] = useState(false);
  const [reportadoPorId, setReportadoPorId] = useState<number | ''>('');

  // Estados de control
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Cargar lista de usuarios al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await fetch('/api/faltantes');
        if (res.ok) {
          const data = await res.json();
          if (data.usuarios) {
            setUsuarios(data.usuarios);
          }
        }
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      }
    }
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!producto.trim()) {
      setMensaje({ texto: 'El nombre del producto es obligatorio.', tipo: 'error' });
      return;
    }

    if (!reportadoPorId) {
      setMensaje({ texto: 'Debe seleccionar quién reporta el faltante.', tipo: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/faltantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producto,
          codigoSae,
          codigoProv,
          marca,
          proveedorSugerido,
          cantidadSugerida: Number(cantidadSugerida),
          motivo,
          diferenciaSae,
          reportadoPorId: Number(reportadoPorId),
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al registrar el faltante');
      }

      setMensaje({ texto: '¡Faltante registrado con éxito!', tipo: 'exito' });
      
      // Limpiar formulario
      setProducto('');
      setCodigoSae('');
      setCodigoProv('');
      setMarca('');
      setProveedorSugerido('');
      setCantidadSugerida(1);
      setMotivo('SIN_EXISTENCIAS');
      setDiferenciaSae(false);
      setReportadoPorId('');

    } catch (error: any) {
      setMensaje({ texto: error.message || 'Error de conexión', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Registro de Producto Faltante
      </h2>

      {mensaje.texto && (
        <div
          className={`p-4 mb-4 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Producto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre del Producto *
          </label>
          <input
            type="text"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
            placeholder="Ej. Cable THW calibre 12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código SAE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Código SAE
            </label>
            <input
              type="text"
              value={codigoSae}
              onChange={(e) => setCodigoSae(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
              placeholder="Clave en Aspel SAE 10"
            />
          </div>

          {/* Código Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Código Proveedor
            </label>
            <input
              type="text"
              value={codigoProv}
              onChange={(e) => setCodigoProv(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
              placeholder="Código alterno"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marca */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
              placeholder="Ej. Kobrex, Siemens..."
            />
          </div>

          {/* Proveedor Sugerido */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Proveedor Sugerido
            </label>
            <input
              type="text"
              value={proveedorSugerido}
              onChange={(e) => setProveedorSugerido(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
              placeholder="Distribuidor..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cantidad Sugerida */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cantidad Sugerida *
            </label>
            <input
              type="number"
              min="1"
              value={cantidadSugerida}
              onChange={(e) => setCantidadSugerida(Number(e.target.value))}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
            />
          </div>

          {/* Motivo del Faltante (Con la nueva opción SIN_EXISTENCIAS) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Motivo del Faltante
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
            >
              <option value="SIN_EXISTENCIAS">⚠️ Sin Existencias</option>
              <option value="ALTA_DEMANDA">🔥 Alta Demanda</option>
              <option value="URGENTE">🚨 Pedido Urgente</option>
              <option value="NUEVO">✨ Producto Nuevo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Reportado por (Usuarios) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reportado Por *
            </label>
            <select
              value={reportadoPorId}
              onChange={(e) => setReportadoPorId(Number(e.target.value))}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black bg-white"
            >
              <option value="">Seleccione un usuario...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          {/* Diferencia SAE */}
          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              id="diferenciaSae"
              checked={diferenciaSae}
              onChange={(e) => setDiferenciaSae(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="diferenciaSae" className="text-sm font-semibold text-gray-700 select-none">
              ¿Existe diferencia en Aspel SAE?
            </label>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition duration-200 disabled:opacity-50 mt-4"
        >
          {loading ? 'Registrando...' : 'Registrar Faltante'}
        </button>
      </form>
    </div>
  );
}