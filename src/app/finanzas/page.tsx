'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiTrash2, FiX, FiArrowLeft, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { 
  getIngresos, getEgresos, createEgreso, deleteEgreso,
  getConfiguracion
} from '@/lib/store';
import { formatMoneda, getHoy, formatFecha, getRangoMes, getMesesDisponibles } from '@/lib/utils';
import { Ingreso, Egreso } from '@/types';
import Link from 'next/link';

export default function FinanzasPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form gasto
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<'suministros' | 'servicios' | 'mantenimiento' | 'otros'>('suministros');

  const meses = getMesesDisponibles();

  useEffect(() => {
    async function init() {
      const config = await getConfiguracion();
      setMoneda(config.moneda);
      
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
    
    setIngresos(
      todosIngresos
        .filter(i => i.fecha >= inicio && i.fecha <= fin)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
    
    setEgresos(
      todosEgresos
        .filter(e => e.fecha >= inicio && e.fecha <= fin)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
    
    setIsLoading(false);
  }

  async function handleAgregarGasto() {
    if (!concepto.trim() || !monto) {
      alert('⚠️ Completa todos los campos');
      return;
    }

    await createEgreso({
      concepto: concepto.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha: getHoy(),
    });

    setConcepto('');
    setMonto('');
    setShowModalGasto(false);
    loadData();
  }

  async function handleEliminarGasto(id: string) {
    if (confirm('¿Eliminar este gasto?')) {
      await deleteEgreso(id);
      loadData();
    }
  }

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);
  const balance = totalIngresos - totalEgresos;

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
          <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">💰 Mi Dinero</h1>
          </div>
        </div>

        {/* Selector de mes - Simple */}
        <select
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium"
        >
          {meses.map((mes) => (
            <option key={mes.value} value={mes.value}>
              📅 {mes.label}
            </option>
          ))}
        </select>

        {/* Resumen grande y claro */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <p className="text-slate-400 text-sm mb-1">Balance del mes</p>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{formatMoneda(balance, moneda)}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingUp className="text-emerald-400" />
                <span className="text-slate-400 text-sm">Entradas</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {formatMoneda(totalIngresos, moneda)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingDown className="text-rose-400" />
                <span className="text-slate-400 text-sm">Gastos</span>
              </div>
              <p className="text-xl font-bold text-rose-400">
                {formatMoneda(totalEgresos, moneda)}
              </p>
            </div>
          </div>
        </div>

        {/* Botón agregar gasto */}
        <button
          onClick={() => setShowModalGasto(true)}
          className="w-full py-4 bg-rose-100 text-rose-700 rounded-xl font-medium flex items-center justify-center gap-2 border-2 border-rose-200"
        >
          <FiPlus className="w-5 h-5" />
          Agregar Gasto
        </button>

        {/* Lista de movimientos recientes */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">📋 Movimientos del mes</h3>
          </div>

          {/* Ingresos */}
          {ingresos.length > 0 && (
            <div className="divide-y divide-slate-50">
              {ingresos.slice(0, 10).map((ingreso) => (
                <div key={ingreso.$id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{ingreso.concepto}</p>
                    <p className="text-xs text-slate-500">{formatFecha(ingreso.fecha)}</p>
                  </div>
                  <span className="font-bold text-emerald-600">
                    +{formatMoneda(ingreso.monto, moneda)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Egresos */}
          {egresos.length > 0 && (
            <div className="divide-y divide-slate-50 bg-rose-50/30">
              {egresos.map((egreso) => (
                <div key={egreso.$id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{egreso.concepto}</p>
                    <p className="text-xs text-slate-500">
                      {formatFecha(egreso.fecha)} • {getCategoriaLabel(egreso.categoria)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600">
                      -{formatMoneda(egreso.monto, moneda)}
                    </span>
                    <button
                      onClick={() => handleEliminarGasto(egreso.$id!)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ingresos.length === 0 && egresos.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-500">No hay movimientos este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal agregar gasto */}
      {showModalGasto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Agregar Gasto</h3>
              <button onClick={() => setShowModalGasto(false)} className="p-2">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  ¿Qué compraste?
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Detergente, luz, agua..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  ¿Cuánto gastaste?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {moneda}
                  </span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Tipo de gasto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'suministros', label: '🧴 Suministros' },
                    { value: 'servicios', label: '💡 Servicios' },
                    { value: 'mantenimiento', label: '🔧 Arreglos' },
                    { value: 'otros', label: '📦 Otros' },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategoria(cat.value as typeof categoria)}
                      className={`py-3 px-4 rounded-xl border-2 text-left ${
                        categoria === cat.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAgregarGasto}
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function getCategoriaLabel(cat: string): string {
  switch (cat) {
    case 'suministros': return 'Suministros';
    case 'servicios': return 'Servicios';
    case 'mantenimiento': return 'Arreglos';
    default: return 'Otros';
  }
}
