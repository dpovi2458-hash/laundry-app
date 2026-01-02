'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiTrash2, FiX, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { getServicios, createServicio, updateServicio, deleteServicio, getConfiguracion } from '@/lib/store';
import { formatMoneda } from '@/lib/utils';
import { Servicio } from '@/types';
import Link from 'next/link';

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [showNuevo, setShowNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form nuevo servicio
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [unidad, setUnidad] = useState<'kg' | 'prenda' | 'unidad'>('kg');

  // Edición rápida de precio
  const [precioEditando, setPrecioEditando] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [serviciosData, config] = await Promise.all([
      getServicios(),
      getConfiguracion(),
    ]);
    setServicios(serviciosData);
    setMoneda(config.moneda);
    setIsLoading(false);
  }

  async function handleCrear() {
    if (!nombre.trim() || !precio) {
      alert('⚠️ Escribe nombre y precio');
      return;
    }

    await createServicio({
      nombre: nombre.trim(),
      descripcion: '',
      precio: parseFloat(precio),
      unidad,
      activo: true,
    });

    setNombre('');
    setPrecio('');
    setShowNuevo(false);
    loadData();
  }

  async function handleToggleActivo(servicio: Servicio) {
    await updateServicio(servicio.$id!, { activo: !servicio.activo });
    loadData();
  }

  async function handleEliminar(id: string) {
    if (confirm('¿Eliminar este servicio?')) {
      await deleteServicio(id);
      loadData();
    }
  }

  function empezarEdicion(servicio: Servicio) {
    setEditandoId(servicio.$id!);
    setPrecioEditando(servicio.precio.toString());
  }

  async function guardarPrecio(servicio: Servicio) {
    const nuevoPrecio = parseFloat(precioEditando);
    if (nuevoPrecio > 0) {
      await updateServicio(servicio.$id!, { precio: nuevoPrecio });
      loadData();
    }
    setEditandoId(null);
  }

  function getUnidadEmoji(unidad: string): string {
    switch (unidad) {
      case 'kg': return '⚖️';
      case 'prenda': return '👔';
      case 'unidad': return '📦';
      default: return '📦';
    }
  }

  function getUnidadLabel(unidad: string): string {
    switch (unidad) {
      case 'kg': return 'por Kilo';
      case 'prenda': return 'por Prenda';
      case 'unidad': return 'por Unidad';
      default: return '';
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/configuracion" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">🧺 Mis Servicios</h1>
            <p className="text-sm text-slate-500">Toca un precio para editarlo</p>
          </div>
        </div>

        {/* Botón agregar */}
        {!showNuevo ? (
          <button
            onClick={() => setShowNuevo(true)}
            className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Agregar Servicio
          </button>
        ) : (
          /* Form nuevo servicio inline */
          <div className="bg-indigo-50 rounded-2xl p-4 border-2 border-indigo-200">
            <h3 className="font-bold text-indigo-800 mb-3">Nuevo Servicio</h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del servicio (ej: Lavado de Edredón)"
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                autoFocus
              />
              
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{moneda}</span>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                  />
                </div>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value as typeof unidad)}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="kg">⚖️ Por Kilo</option>
                  <option value="prenda">👔 Por Prenda</option>
                  <option value="unidad">📦 Por Unidad</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNuevo(false)}
                  className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrear}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" />
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de servicios */}
        <div className="space-y-3">
          {servicios.map((servicio) => (
            <div
              key={servicio.$id}
              className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                servicio.activo 
                  ? 'border-slate-200' 
                  : 'border-slate-100 opacity-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji y nombre */}
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {getUnidadEmoji(servicio.unidad)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-lg">{servicio.nombre}</p>
                  <p className="text-sm text-slate-500">{getUnidadLabel(servicio.unidad)}</p>
                </div>

                {/* Precio editable */}
                <div className="text-right">
                  {editandoId === servicio.$id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{moneda}</span>
                      <input
                        type="number"
                        value={precioEditando}
                        onChange={(e) => setPrecioEditando(e.target.value)}
                        className="w-20 px-2 py-1 border-2 border-indigo-500 rounded-lg text-right text-lg font-bold"
                        autoFocus
                        onBlur={() => guardarPrecio(servicio)}
                        onKeyDown={(e) => e.key === 'Enter' && guardarPrecio(servicio)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => empezarEdicion(servicio)}
                      className="text-2xl font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      {formatMoneda(servicio.precio, moneda)}
                    </button>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleActivo(servicio)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    servicio.activo
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {servicio.activo ? '✓ Activo' : '○ Inactivo'}
                </button>
                
                <button
                  onClick={() => handleEliminar(servicio.$id!)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {servicios.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧺</p>
              <p className="text-slate-600 font-medium">No hay servicios</p>
              <p className="text-slate-400 text-sm mt-1">Agrega tu primer servicio arriba</p>
            </div>
          )}
        </div>

        {/* Sugerencias de servicios comunes */}
        {servicios.length < 3 && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="font-medium text-amber-800 mb-3">💡 Servicios comunes:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { nombre: 'Lavado por Kilo', precio: 8, unidad: 'kg' as const },
                { nombre: 'Lavado de Edredón', precio: 25, unidad: 'unidad' as const },
                { nombre: 'Lavado de Frazada', precio: 18, unidad: 'unidad' as const },
                { nombre: 'Planchado', precio: 3, unidad: 'prenda' as const },
                { nombre: 'Lavado en Seco', precio: 15, unidad: 'prenda' as const },
                { nombre: 'Lavado de Zapatillas', precio: 12, unidad: 'unidad' as const },
              ].filter(s => !servicios.some(existente => existente.nombre === s.nombre))
              .slice(0, 4)
              .map((sugerencia) => (
                <button
                  key={sugerencia.nombre}
                  onClick={async () => {
                    await createServicio({
                      ...sugerencia,
                      descripcion: '',
                      activo: true,
                    });
                    loadData();
                  }}
                  className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  + {sugerencia.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
