'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { 
  getIngresos, getEgresos, createIngreso, createEgreso, 
  deleteIngreso, deleteEgreso,
  getConfiguracion 
} from '@/lib/store';
import { formatMoneda, formatFecha, getHoy, getMesesDisponibles, getRangoMes } from '@/lib/utils';
import { Ingreso, Egreso } from '@/types';

type Tab = 'ingresos' | 'egresos';
type ModalType = 'ingreso' | 'egreso' | null;

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>('ingresos');
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<Ingreso | Egreso | null>(null);
  const [formIngreso, setFormIngreso] = useState({
    concepto: '',
    monto: '',
    categoria: 'otro' as 'pedido' | 'otro',
    fecha: getHoy(),
    notas: '',
  });
  const [formEgreso, setFormEgreso] = useState({
    concepto: '',
    monto: '',
    categoria: 'otros' as 'suministros' | 'servicios' | 'mantenimiento' | 'otros',
    fecha: getHoy(),
    notas: '',
  });

  const meses = getMesesDisponibles();

  useEffect(() => {
    async function init() {
      const config = await getConfiguracion();
      setMoneda(config.moneda);
      
      // Seleccionar mes actual por defecto
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      setMesSeleccionado(mesActual);
    }
    init();
  }, []);

  useEffect(() => {
    if (mesSeleccionado) {
      loadData();
    }
  }, [mesSeleccionado]);

  async function loadData() {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    const { inicio, fin } = getRangoMes(year, month - 1);
    
    const [todosIngresos, todosEgresos] = await Promise.all([
      getIngresos(),
      getEgresos(),
    ]);
    
    const ingresosFiltrados = todosIngresos
      .filter(i => i.fecha >= inicio && i.fecha <= fin)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    const egresosFiltrados = todosEgresos
      .filter(e => e.fecha >= inicio && e.fecha <= fin)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    setIngresos(ingresosFiltrados);
    setEgresos(egresosFiltrados);
    
    const totalIngresos = ingresosFiltrados.reduce((sum, i) => sum + i.monto, 0);
    const totalEgresos = egresosFiltrados.reduce((sum, e) => sum + e.monto, 0);
    
    setResumen({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
    });
  }

  function handleOpenModal(type: 'ingreso' | 'egreso', item?: Ingreso | Egreso) {
    setShowModal(type);
    if (item) {
      setEditingItem(item);
      if (type === 'ingreso') {
        const ingreso = item as Ingreso;
        setFormIngreso({
          concepto: ingreso.concepto,
          monto: ingreso.monto.toString(),
          categoria: ingreso.categoria,
          fecha: ingreso.fecha,
          notas: ingreso.notas || '',
        });
      } else {
        const egreso = item as Egreso;
        setFormEgreso({
          concepto: egreso.concepto,
          monto: egreso.monto.toString(),
          categoria: egreso.categoria,
          fecha: egreso.fecha,
          notas: egreso.notas || '',
        });
      }
    } else {
      setEditingItem(null);
      setFormIngreso({
        concepto: '',
        monto: '',
        categoria: 'otro',
        fecha: getHoy(),
        notas: '',
      });
      setFormEgreso({
        concepto: '',
        monto: '',
        categoria: 'otros',
        fecha: getHoy(),
        notas: '',
      });
    }
  }

  function handleCloseModal() {
    setShowModal(null);
    setEditingItem(null);
  }

  async function handleSubmitIngreso(e: React.FormEvent) {
    e.preventDefault();
    
    const data = {
      concepto: formIngreso.concepto,
      monto: parseFloat(formIngreso.monto) || 0,
      categoria: formIngreso.categoria,
      fecha: formIngreso.fecha,
      notas: formIngreso.notas,
    };

    await createIngreso(data);

    await loadData();
    handleCloseModal();
  }

  async function handleSubmitEgreso(e: React.FormEvent) {
    e.preventDefault();
    
    const data = {
      concepto: formEgreso.concepto,
      monto: parseFloat(formEgreso.monto) || 0,
      categoria: formEgreso.categoria,
      fecha: formEgreso.fecha,
      notas: formEgreso.notas,
    };

    await createEgreso(data);

    await loadData();
    handleCloseModal();
  }

  async function handleDeleteIngreso(id: string) {
    if (confirm('¿Eliminar este ingreso?')) {
      await deleteIngreso(id);
      await loadData();
    }
  }

  async function handleDeleteEgreso(id: string) {
    if (confirm('¿Eliminar este egreso?')) {
      await deleteEgreso(id);
      await loadData();
    }
  }

  function getCategoriaLabel(categoria: string): string {
    const labels: Record<string, string> = {
      pedido: 'Pedido',
      otro: 'Otro',
      suministros: 'Suministros',
      servicios: 'Servicios',
      mantenimiento: 'Mantenimiento',
      otros: 'Otros',
    };
    return labels[categoria] || categoria;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finanzas</h1>
            <p className="text-sm text-gray-500">Control de ingresos y egresos</p>
          </div>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 capitalize text-base"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value} className="capitalize">
                {mes.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-500">Ingresos</p>
            <p className="text-sm md:text-2xl font-bold text-green-600 truncate">
              {formatMoneda(resumen.ingresos, moneda)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-500">Egresos</p>
            <p className="text-sm md:text-2xl font-bold text-red-600 truncate">
              {formatMoneda(resumen.egresos, moneda)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-500">Balance</p>
            <p className={`text-sm md:text-2xl font-bold truncate ${resumen.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoneda(resumen.balance, moneda)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b">
            <button
              onClick={() => setTab('ingresos')}
              className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center text-sm md:text-base font-medium transition-colors ${tab === 'ingresos' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            >
              Ingresos ({ingresos.length})
            </button>
            <button
              onClick={() => setTab('egresos')}
              className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center text-sm md:text-base font-medium transition-colors ${tab === 'egresos' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}
            >
              Egresos ({egresos.length})
            </button>
          </div>

          <div className="p-3 md:p-4">
            {/* Add button */}
            <div className="mb-3">
              <button
                onClick={() => handleOpenModal(tab === 'ingresos' ? 'ingreso' : 'egreso')}
                className={`w-full md:w-auto md:float-right inline-flex items-center justify-center px-4 py-3 md:py-2 rounded-lg text-white transition-colors ${tab === 'ingresos' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <FiPlus className="mr-2" />
                Nuevo {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
              </button>
              <div className="clear-both"></div>
            </div>

            {/* Ingresos List */}
            {tab === 'ingresos' && (
              <div className="space-y-2">
                {ingresos.length === 0 ? (
                  <p className="text-center py-6 text-gray-500 text-sm">No hay ingresos</p>
                ) : (
                  ingresos.map((ingreso) => (
                    <div key={ingreso.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{ingreso.concepto}</p>
                        <p className="text-xs text-gray-500">{formatFecha(ingreso.fecha)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-green-600 text-sm">+{formatMoneda(ingreso.monto, moneda)}</span>
                        <button onClick={() => handleDeleteIngreso(ingreso.$id!)} className="p-2 text-gray-400 hover:text-red-600">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Egresos List */}
            {tab === 'egresos' && (
              <div className="space-y-2">
                {egresos.length === 0 ? (
                  <p className="text-center py-6 text-gray-500 text-sm">No hay egresos</p>
                ) : (
                  egresos.map((egreso) => (
                    <div key={egreso.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{egreso.concepto}</p>
                        <p className="text-xs text-gray-500">{formatFecha(egreso.fecha)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-red-600 text-sm">-{formatMoneda(egreso.monto, moneda)}</span>
                        <button onClick={() => handleDeleteEgreso(egreso.$id!)} className="p-2 text-gray-400 hover:text-red-600">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ingreso */}
      {showModal === 'ingreso' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIngreso} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={formIngreso.concepto}
                  onChange={(e) => setFormIngreso({ ...formIngreso, concepto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Descripción del ingreso"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formIngreso.monto}
                    onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formIngreso.categoria}
                    onChange={(e) => setFormIngreso({ ...formIngreso, categoria: e.target.value as 'pedido' | 'otro' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pedido">Pedido</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formIngreso.fecha}
                  onChange={(e) => setFormIngreso({ ...formIngreso, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={formIngreso.notas}
                  onChange={(e) => setFormIngreso({ ...formIngreso, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingItem ? 'Guardar' : 'Crear Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Egreso */}
      {showModal === 'egreso' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Editar Egreso' : 'Nuevo Egreso'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEgreso} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={formEgreso.concepto}
                  onChange={(e) => setFormEgreso({ ...formEgreso, concepto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Descripción del gasto"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formEgreso.monto}
                    onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formEgreso.categoria}
                    onChange={(e) => setFormEgreso({ ...formEgreso, categoria: e.target.value as 'suministros' | 'servicios' | 'mantenimiento' | 'otros' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="suministros">Suministros</option>
                    <option value="servicios">Servicios</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formEgreso.fecha}
                  onChange={(e) => setFormEgreso({ ...formEgreso, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={formEgreso.notas}
                  onChange={(e) => setFormEgreso({ ...formEgreso, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingItem ? 'Guardar' : 'Crear Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
