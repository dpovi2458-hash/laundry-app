'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag, FiPrinter } from 'react-icons/fi';
import { 
  getIngresos, getEgresos, getPedidos, getConfiguracion 
} from '@/lib/store';
import { 
  formatMoneda, getMesesDisponibles, getRangoMes, getDiasDelMes, 
  formatFecha, getHoy, getInicioSemana, getFinSemana 
} from '@/lib/utils';

type ViewType = 'diario' | 'semanal' | 'mensual';

interface DayReport {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
  pedidos: number;
}

export default function ReportesPage() {
  const [viewType, setViewType] = useState<ViewType>('diario');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [moneda, setMoneda] = useState('S/');
  const [reporteDiario, setReporteDiario] = useState<DayReport[]>([]);
  const [resumenTotal, setResumenTotal] = useState({
    ingresos: 0,
    egresos: 0,
    balance: 0,
    pedidos: 0,
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
      generarReporte();
    }
  }, [mesSeleccionado, viewType]);

  async function generarReporte() {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    const dias = getDiasDelMes(year, month - 1);
    
    const [todosIngresos, todosEgresos, todosPedidos] = await Promise.all([
      getIngresos(),
      getEgresos(),
      getPedidos(),
    ]);

    if (viewType === 'diario') {
      const reporte: DayReport[] = dias.map(fecha => {
        const ingresosDelDia = todosIngresos.filter(i => i.fecha === fecha);
        const egresosDelDia = todosEgresos.filter(e => e.fecha === fecha);
        const pedidosDelDia = todosPedidos.filter(p => p.fechaRecepcion === fecha);
        
        const totalIngresos = ingresosDelDia.reduce((sum, i) => sum + i.monto, 0);
        const totalEgresos = egresosDelDia.reduce((sum, e) => sum + e.monto, 0);
        
        return {
          fecha,
          ingresos: totalIngresos,
          egresos: totalEgresos,
          balance: totalIngresos - totalEgresos,
          pedidos: pedidosDelDia.length,
        };
      }).reverse();

      setReporteDiario(reporte);
      
      const totales = reporte.reduce((acc, day) => ({
        ingresos: acc.ingresos + day.ingresos,
        egresos: acc.egresos + day.egresos,
        balance: acc.balance + day.balance,
        pedidos: acc.pedidos + day.pedidos,
      }), { ingresos: 0, egresos: 0, balance: 0, pedidos: 0 });
      
      setResumenTotal(totales);
    } else if (viewType === 'semanal') {
      // Agrupar por semanas
      const semanas: Record<number, DayReport> = {};
      
      dias.forEach(fecha => {
        const date = new Date(fecha);
        const semana = getWeekNumber(date);
        
        if (!semanas[semana]) {
          semanas[semana] = { fecha: `Semana ${semana}`, ingresos: 0, egresos: 0, balance: 0, pedidos: 0 };
        }
        
        const ingresosDelDia = todosIngresos.filter(i => i.fecha === fecha);
        const egresosDelDia = todosEgresos.filter(e => e.fecha === fecha);
        const pedidosDelDia = todosPedidos.filter(p => p.fechaRecepcion === fecha);
        
        semanas[semana].ingresos += ingresosDelDia.reduce((sum, i) => sum + i.monto, 0);
        semanas[semana].egresos += egresosDelDia.reduce((sum, e) => sum + e.monto, 0);
        semanas[semana].pedidos += pedidosDelDia.length;
      });
      
      const reporte = Object.values(semanas).map(s => ({
        ...s,
        balance: s.ingresos - s.egresos,
      }));
      
      setReporteDiario(reporte);
      
      const totales = reporte.reduce((acc, week) => ({
        ingresos: acc.ingresos + week.ingresos,
        egresos: acc.egresos + week.egresos,
        balance: acc.balance + week.balance,
        pedidos: acc.pedidos + week.pedidos,
      }), { ingresos: 0, egresos: 0, balance: 0, pedidos: 0 });
      
      setResumenTotal(totales);
    } else {
      // Mensual - un solo registro
      const { inicio, fin } = getRangoMes(year, month - 1);
      
      const ingresosMes = todosIngresos.filter(i => i.fecha >= inicio && i.fecha <= fin);
      const egresosMes = todosEgresos.filter(e => e.fecha >= inicio && e.fecha <= fin);
      const pedidosMes = todosPedidos.filter(p => p.fechaRecepcion >= inicio && p.fechaRecepcion <= fin);
      
      const totalIngresos = ingresosMes.reduce((sum, i) => sum + i.monto, 0);
      const totalEgresos = egresosMes.reduce((sum, e) => sum + e.monto, 0);
      
      const mesLabel = meses.find(m => m.value === mesSeleccionado)?.label || mesSeleccionado;
      
      setReporteDiario([{
        fecha: mesLabel,
        ingresos: totalIngresos,
        egresos: totalEgresos,
        balance: totalIngresos - totalEgresos,
        pedidos: pedidosMes.length,
      }]);
      
      setResumenTotal({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        balance: totalIngresos - totalEgresos,
        pedidos: pedidosMes.length,
      });
    }
  }

  function getWeekNumber(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfMonth + dayOfWeek) / 7);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-500">Análisis de ingresos, egresos y pedidos</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 capitalize"
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value} className="capitalize">
                  {mes.label}
                </option>
              ))}
            </select>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              <FiPrinter className="mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        {/* View Type Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 inline-flex no-print">
          <button
            onClick={() => setViewType('diario')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewType === 'diario' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => setViewType('semanal')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewType === 'semanal' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setViewType('mensual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewType === 'mensual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mensual
          </button>
        </div>

        {/* Resumen Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="font-bold text-green-600">{formatMoneda(resumenTotal.ingresos, moneda)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FiTrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Egresos</p>
                <p className="font-bold text-red-600">{formatMoneda(resumenTotal.egresos, moneda)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`font-bold ${resumenTotal.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(resumenTotal.balance, moneda)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pedidos</p>
                <p className="font-bold text-purple-600">{resumenTotal.pedidos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Reporte */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {viewType === 'diario' ? 'Fecha' : viewType === 'semanal' ? 'Semana' : 'Periodo'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ingresos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Egresos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reporteDiario.map((row, index) => (
                  <tr key={index} className={row.ingresos === 0 && row.egresos === 0 ? 'text-gray-400' : ''}>
                    <td className="px-4 py-3">
                      {viewType === 'diario' ? formatFecha(row.fecha) : row.fecha}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.ingresos > 0 ? 'text-green-600 font-medium' : ''}>
                        {formatMoneda(row.ingresos, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.egresos > 0 ? 'text-red-600 font-medium' : ''}>
                        {formatMoneda(row.egresos, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${row.balance > 0 ? 'text-green-600' : row.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatMoneda(row.balance, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.pedidos > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {row.pedidos}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatMoneda(resumenTotal.ingresos, moneda)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {formatMoneda(resumenTotal.egresos, moneda)}
                  </td>
                  <td className={`px-4 py-3 text-right ${resumenTotal.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoneda(resumenTotal.balance, moneda)}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600">
                    {resumenTotal.pedidos}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Calculadora rápida */}
        <CalculadoraRapida moneda={moneda} />
      </div>
    </DashboardLayout>
  );
}

// Componente de calculadora rápida
function CalculadoraRapida({ moneda }: { moneda: string }) {
  const [valores, setValores] = useState<string[]>(['']);
  const [operacion, setOperacion] = useState<'suma' | 'resta'>('suma');

  const total = valores.reduce((sum, val) => {
    const num = parseFloat(val) || 0;
    return operacion === 'suma' ? sum + num : sum - num;
  }, 0);

  function agregarCampo() {
    setValores([...valores, '']);
  }

  function actualizarValor(index: number, value: string) {
    const nuevos = [...valores];
    nuevos[index] = value;
    setValores(nuevos);
  }

  function limpiar() {
    setValores(['']);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 no-print">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculadora Rápida</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setOperacion('suma')}
          className={`px-4 py-2 rounded-lg ${operacion === 'suma' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
        >
          Sumar (+)
        </button>
        <button
          onClick={() => setOperacion('resta')}
          className={`px-4 py-2 rounded-lg ${operacion === 'resta' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
        >
          Restar (-)
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {valores.map((valor, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-500">{moneda}</span>
            <input
              type="number"
              value={valor}
              onChange={(e) => actualizarValor(index, e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={agregarCampo}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Agregar
        </button>
        <button
          onClick={limpiar}
          className="px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Resultado:</p>
        <p className={`text-3xl font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatMoneda(total, moneda)}
        </p>
      </div>
    </div>
  );
}
