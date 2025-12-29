'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiTrash2, FiX, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { 
  getIngresos, getEgresos, createIngreso, createEgreso, 
  deleteIngreso, deleteEgreso,
  getConfiguracion, getDatosGraficaMensual
} from '@/lib/store';
import { formatMoneda, getHoy, getMesesDisponibles, getRangoMes } from '@/lib/utils';
import { Ingreso, Egreso } from '@/types';

type Tab = 'ingresos' | 'egresos';
type ModalType = 'ingreso' | 'egreso' | null;

interface DatoGrafica {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
  balanceAcumulado: number;
}

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>('ingresos');
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [datosGrafica, setDatosGrafica] = useState<DatoGrafica[]>([]);
  
  const [showModal, setShowModal] = useState<ModalType>(null);
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
    
    const [todosIngresos, todosEgresos, graficaData] = await Promise.all([
      getIngresos(),
      getEgresos(),
      getDatosGraficaMensual(year, month - 1),
    ]);
    
    const ingresosFiltrados = todosIngresos
      .filter(i => i.fecha >= inicio && i.fecha <= fin)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    const egresosFiltrados = todosEgresos
      .filter(e => e.fecha >= inicio && e.fecha <= fin)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    setIngresos(ingresosFiltrados);
    setEgresos(egresosFiltrados);
    setDatosGrafica(graficaData);
    
    const totalIngresos = ingresosFiltrados.reduce((sum, i) => sum + i.monto, 0);
    const totalEgresos = egresosFiltrados.reduce((sum, e) => sum + e.monto, 0);
    
    setResumen({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
    });
  }

  function handleOpenModal(type: 'ingreso' | 'egreso') {
    setShowModal(type);
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

  function handleCloseModal() {
    setShowModal(null);
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

  const ultimoBalance = datosGrafica.length > 0 ? datosGrafica[datosGrafica.length - 1].balanceAcumulado : 0;
  const primerBalance = datosGrafica.length > 1 ? datosGrafica[0].balanceAcumulado : 0;
  const cambio = primerBalance !== 0 ? ((ultimoBalance - primerBalance) / Math.abs(primerBalance)) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finanzas</h1>
            <p className="text-sm text-gray-500">Control de ingresos y egresos</p>
          </div>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 capitalize text-base bg-white shadow-sm"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value} className="capitalize">
                {mes.label}
              </option>
            ))}
          </select>
        </div>

        {/* Gráfica estilo Trading/Bolsa */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Balance Acumulado</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl md:text-4xl font-bold">
                  {formatMoneda(ultimoBalance, moneda)}
                </span>
                <span className={`flex items-center text-sm font-medium px-2 py-1 rounded-lg ${
                  cambio >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {cambio >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                  {cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%
                </span>
              </div>
            </div>
            <FiActivity className="w-8 h-8 text-blue-400 hidden sm:block" />
          </div>
          
          <TradingChart datos={datosGrafica} moneda={moneda} />
        </div>

        {/* Resumen Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-xs md:text-sm text-gray-500">Ingresos</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-green-600 truncate">
              {formatMoneda(resumen.ingresos, moneda)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-5 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingDown className="w-4 h-4 text-red-500" />
              <p className="text-xs md:text-sm text-gray-500">Egresos</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-red-600 truncate">
              {formatMoneda(resumen.egresos, moneda)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="w-4 h-4 text-blue-500" />
              <p className="text-xs md:text-sm text-gray-500">Balance</p>
            </div>
            <p className={`text-sm md:text-xl font-bold truncate ${resumen.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoneda(resumen.balance, moneda)}
            </p>
          </div>
        </div>

        {/* Tabs y Lista */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setTab('ingresos')}
              className={`flex-1 px-3 md:px-6 py-4 text-center text-sm md:text-base font-medium transition-all ${
                tab === 'ingresos' 
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <FiTrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Ingresos</span> ({ingresos.length})
              </span>
            </button>
            <button
              onClick={() => setTab('egresos')}
              className={`flex-1 px-3 md:px-6 py-4 text-center text-sm md:text-base font-medium transition-all ${
                tab === 'egresos' 
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <FiTrendingDown className="w-4 h-4" />
                <span className="hidden sm:inline">Egresos</span> ({egresos.length})
              </span>
            </button>
          </div>

          <div className="p-3 md:p-4">
            <button
              onClick={() => handleOpenModal(tab === 'ingresos' ? 'ingreso' : 'egreso')}
              className={`w-full mb-4 inline-flex items-center justify-center px-4 py-3 rounded-xl text-white font-medium transition-all active:scale-[0.98] ${
                tab === 'ingresos' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              <FiPlus className="mr-2 w-5 h-5" />
              Nuevo {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
            </button>

            {tab === 'ingresos' && (
              <div className="space-y-2">
                {ingresos.length === 0 ? (
                  <div className="text-center py-8">
                    <FiTrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No hay ingresos este mes</p>
                  </div>
                ) : (
                  ingresos.map((ingreso) => (
                    <div 
                      key={ingreso.$id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-100 gap-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{ingreso.concepto}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ingreso.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-green-600">+{formatMoneda(ingreso.monto, moneda)}</span>
                        <button 
                          onClick={() => handleDeleteIngreso(ingreso.$id!)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'egresos' && (
              <div className="space-y-2">
                {egresos.length === 0 ? (
                  <div className="text-center py-8">
                    <FiTrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No hay egresos este mes</p>
                  </div>
                ) : (
                  egresos.map((egreso) => (
                    <div 
                      key={egreso.$id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100 gap-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{egreso.concepto}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(egreso.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-red-600">-{formatMoneda(egreso.monto, moneda)}</span>
                        <button 
                          onClick={() => handleDeleteEgreso(egreso.$id!)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b rounded-t-3xl md:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Nuevo Ingreso</h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitIngreso} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Concepto</label>
                <input
                  type="text"
                  value={formIngreso.concepto}
                  onChange={(e) => setFormIngreso({ ...formIngreso, concepto: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  placeholder="Ej: Pago de cliente"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formIngreso.monto}
                    onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formIngreso.categoria}
                    onChange={(e) => setFormIngreso({ ...formIngreso, categoria: e.target.value as 'pedido' | 'otro' })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-base bg-white"
                  >
                    <option value="pedido">Pedido</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formIngreso.fecha}
                  onChange={(e) => setFormIngreso({ ...formIngreso, fecha: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border-2 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 active:scale-[0.98] transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Egreso */}
      {showModal === 'egreso' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b rounded-t-3xl md:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Nuevo Egreso</h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitEgreso} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Concepto</label>
                <input
                  type="text"
                  value={formEgreso.concepto}
                  onChange={(e) => setFormEgreso({ ...formEgreso, concepto: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 text-base"
                  placeholder="Ej: Compra de suministros"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formEgreso.monto}
                    onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formEgreso.categoria}
                    onChange={(e) => setFormEgreso({ ...formEgreso, categoria: e.target.value as 'suministros' | 'servicios' | 'mantenimiento' | 'otros' })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 text-base bg-white"
                  >
                    <option value="suministros">Suministros</option>
                    <option value="servicios">Servicios</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formEgreso.fecha}
                  onChange={(e) => setFormEgreso({ ...formEgreso, fecha: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 text-base"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border-2 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function TradingChart({ datos, moneda }: { datos: DatoGrafica[]; moneda: string }) {
  if (datos.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const width = 100;
  const height = 100;
  const padding = 5;

  const datosActivos = datos.filter((d, i) => d.ingresos > 0 || d.egresos > 0 || i >= datos.length - 15);
  const datosParaGrafica = datosActivos.length > 0 ? datosActivos : datos.slice(-15);

  const valores = datosParaGrafica.map(d => d.balanceAcumulado);
  const minVal = Math.min(...valores, 0);
  const maxVal = Math.max(...valores, 1);
  const range = maxVal - minVal || 1;

  const points = datosParaGrafica.map((d, i) => {
    const x = padding + (i / (datosParaGrafica.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((d.balanceAcumulado - minVal) / range) * (height - padding * 2);
    return { x, y, data: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${height - padding} L ${padding} ${height - padding} Z`;

  const isPositive = (valores[valores.length - 1] || 0) >= 0;
  const gradientId = isPositive ? 'greenGradient' : 'redGradient';
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-40 md:h-48"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {minVal < 0 && maxVal > 0 && (
          <line
            x1={padding}
            y1={height - padding - ((0 - minVal) / range) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - ((0 - minVal) / range) * (height - padding * 2)}
            stroke="#ffffff20"
            strokeDasharray="2,2"
          />
        )}
        
        <path d={areaPath} fill={`url(#${gradientId})`} />
        
        <path 
          d={linePath} 
          fill="none" 
          stroke={lineColor} 
          strokeWidth="0.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {points.length > 0 && (
          <g>
            <circle 
              cx={points[points.length - 1].x} 
              cy={points[points.length - 1].y} 
              r="1.5" 
              fill={lineColor}
              className="animate-pulse"
            />
          </g>
        )}
      </svg>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
        <span>{datosParaGrafica[0]?.fecha.split('-')[2]}/{datosParaGrafica[0]?.fecha.split('-')[1]}</span>
        <span>{datosParaGrafica[Math.floor(datosParaGrafica.length / 2)]?.fecha.split('-')[2]}/{datosParaGrafica[Math.floor(datosParaGrafica.length / 2)]?.fecha.split('-')[1]}</span>
        <span>{datosParaGrafica[datosParaGrafica.length - 1]?.fecha.split('-')[2]}/{datosParaGrafica[datosParaGrafica.length - 1]?.fecha.split('-')[1]}</span>
      </div>
    </div>
  );
}

interface DatoGrafica {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
  balanceAcumulado: number;
}
