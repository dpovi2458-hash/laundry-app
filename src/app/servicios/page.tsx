'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { getServicios, createServicio, updateServicio, deleteServicio, getConfiguracion } from '@/lib/store';
import { formatMoneda } from '@/lib/utils';
import { Servicio } from '@/types';

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    unidad: 'kg' as 'kg' | 'prenda' | 'unidad',
    activo: true,
  });

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
  }

  function handleOpenModal(servicio?: Servicio) {
    if (servicio) {
      setEditingServicio(servicio);
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio.toString(),
        unidad: servicio.unidad,
        activo: servicio.activo,
      });
    } else {
      setEditingServicio(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        unidad: 'kg',
        activo: true,
      });
    }
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingServicio(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const data = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio) || 0,
      unidad: formData.unidad,
      activo: formData.activo,
    };

    if (editingServicio) {
      await updateServicio(editingServicio.$id!, data);
    } else {
      await createServicio(data);
    }

    await loadData();
    handleCloseModal();
  }

  async function handleDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      await deleteServicio(id);
      await loadData();
    }
  }

  async function handleToggleActivo(servicio: Servicio) {
    await updateServicio(servicio.$id!, { activo: !servicio.activo });
    await loadData();
  }

  function getUnidadLabel(unidad: string): string {
    switch (unidad) {
      case 'kg': return 'por Kg';
      case 'prenda': return 'por Prenda';
      case 'unidad': return 'por Unidad';
      default: return unidad;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Servicios</h1>
            <p className="text-sm text-gray-500">Gestiona tus servicios</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Nuevo Servicio
          </button>
        </div>

        {/* Lista de Servicios - Cards en móvil */}
        <div className="md:hidden space-y-3">
          {servicios.map((servicio) => (
            <div key={servicio.$id} className={`bg-white rounded-xl shadow-sm p-4 ${!servicio.activo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{servicio.nombre}</p>
                  <p className="text-sm text-gray-500 truncate">{servicio.descripcion}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-blue-600">{formatMoneda(servicio.precio, moneda)}</span>
                    <span className="text-xs text-gray-400">{getUnidadLabel(servicio.unidad)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActivo(servicio)}
                  className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${servicio.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {servicio.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleOpenModal(servicio)}
                  className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(servicio.$id!)}
                  className="py-2 px-4 text-red-600 bg-red-50 rounded-lg text-sm font-medium"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {servicios.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">No hay servicios</div>
          )}
        </div>

        {/* Lista de Servicios - Tabla en desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {servicios.map((servicio) => (
                  <tr key={servicio.$id} className={!servicio.activo ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <p className={`font-medium ${!servicio.activo ? 'text-gray-400' : 'text-gray-900'}`}>{servicio.nombre}</p>
                      <p className="text-sm text-gray-500">{servicio.descripcion}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatMoneda(servicio.precio, moneda)}</td>
                    <td className="px-6 py-4 text-gray-500">{getUnidadLabel(servicio.unidad)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActivo(servicio)} className={`px-3 py-1 rounded-full text-xs font-medium ${servicio.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(servicio)} className="p-2 text-gray-400 hover:text-blue-600"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(servicio.$id!)} className="p-2 text-gray-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {servicios.length === 0 && <div className="text-center py-12 text-gray-500">No hay servicios</div>}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full md:max-w-md md:m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Ej: Lavado por Kilo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Descripción del servicio"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value as 'kg' | 'prenda' | 'unidad' })}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="kg">Por Kg</option>
                    <option value="prenda">Por Prenda</option>
                    <option value="unidad">Por Unidad</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="text-gray-700">Servicio activo</label>
              </div>

              <div className="flex gap-3 pt-2 pb-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  {editingServicio ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
