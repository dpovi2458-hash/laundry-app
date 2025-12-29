'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiTrendingDown, FiClock, FiActivity, FiArrowRight } from 'react-icons/fi';
import { getResumenDiario, getResumenPorRango, getPedidos, getConfiguracion, getDatosGraficaMensual } from '@/lib/store';
import { getHoy, getInicioSemana, getFinSemana, getInicioMes, getFinMes, formatMoneda, formatFecha, getNombreMes, getDiaSemana } from '@/lib/utils';
import Link from 'next/link';
import { Pedido } from '@/types';

interface Resumen {
  ingresos: number;
  egresos: number;
  balance: number;
  cantidadPedidos: number;
  pedidosPendientes: number;
}

interface DatoGrafica {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
  balanceAcumulado: number;
}

export default function HomePage() {
  const [resumenHoy, setResumenHoy] = useState<Resumen | null>(null);
  const [resumenSemana, setResumenSemana] = useState<Resumen | null>(null);
  const [resumenMes, setResumenMes] = useState<Resumen | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [isLoading, setIsLoading] = useState(true);
  const [datosGrafica, setDatosGrafica] = useState<DatoGrafica[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const config = await getConfiguracion();
    setMoneda(config.moneda);

    const hoy = getHoy();
    const inicioSemana = getInicioSemana();
    const finSemana = getFinSemana();
    const inicioMes = getInicioMes();
    const finMes = getFinMes();
    
    const ahora = new Date();

    const [resHoy, resSemana, resMes, allPedidos, graficaData] = await Promise.all([
      getResumenDiario(hoy),
      getResumenPorRango(inicioSemana, finSemana),
      getResumenPorRango(inicioMes, finMes),
      getPedidos(),
      getDatosGraficaMensual(ahora.getFullYear(), ahora.getMonth()),
    ]);

    setResumenHoy(resHoy);
    setResumenSemana(resSemana);
    setResumenMes(resMes);
    setDatosGrafica(graficaData);

    setPedidosPendientes(
      allPedidos
        .filter(p => p.estado !== 'entregado')
        .sort((a, b) => new Date(a.fechaRecepcion).getTime() - new Date(b.fechaRecepcion).getTime())
        .slice(0, 5)
    );

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const ultimoBalance = datosGrafica.length > 0 ? datosGrafica[datosGrafica.length - 1].balanceAcumulado : 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 capitalize">
              {getDiaSemana()}, {formatFecha(getHoy())}
            </p>
          </div>
          <Link
            href="/nuevo-pedido"
            className="w-full md:w-auto text-center inline-flex items-center justify-center px-4 py-3 md:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            <FiShoppingBag className="mr-2" />
            Nuevo Pedido
          </Link>
        </div>

        {/* Mini Gráfica del Mes - Estilo Trading */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-400 text-xs">{getNombreMes()} - Balance</p>
              <p className="text-xl md:text-2xl font-bold">
                {formatMoneda(ultimoBalance, moneda)}
              </p>
            </div>
            <Link 
              href="/finanzas"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              Ver más <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <MiniChart datos={datosGrafica} />
        </div>

        {/* Stats Cards - Hoy */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Ingresos Hoy"
            value={formatMoneda(resumenHoy?.ingresos || 0, moneda)}
            icon={<FiTrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />}
            color="green"
          />
          <StatCard
            title="Egresos Hoy"
            value={formatMoneda(resumenHoy?.egresos || 0, moneda)}
            icon={<FiTrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />}
            color="red"
          />
          <StatCard
            title="Balance Hoy"
            value={formatMoneda(resumenHoy?.balance || 0, moneda)}
            icon={<FiDollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Pedidos"
            value={String(resumenHoy?.cantidadPedidos || 0)}
            subtitle={`${resumenHoy?.pedidosPendientes || 0} pend.`}
            icon={<FiShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />}
            color="purple"
          />
        </div>

        {/* Stats Semana y Mes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resumen Semanal */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiActivity className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Esta Semana</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ingresos</span>
                <span className="font-semibold text-green-600">
                  {formatMoneda(resumenSemana?.ingresos || 0, moneda)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Egresos</span>
                <span className="font-semibold text-red-600">
                  {formatMoneda(resumenSemana?.egresos || 0, moneda)}
                </span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-800 font-medium">Balance</span>
                <span className={`font-bold text-lg ${(resumenSemana?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(resumenSemana?.balance || 0, moneda)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen Mensual */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiActivity className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">{getNombreMes()}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ingresos</span>
                <span className="font-semibold text-green-600">
                  {formatMoneda(resumenMes?.ingresos || 0, moneda)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Egresos</span>
                <span className="font-semibold text-red-600">
                  {formatMoneda(resumenMes?.egresos || 0, moneda)}
                </span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-800 font-medium">Balance</span>
                <span className={`font-bold text-lg ${(resumenMes?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(resumenMes?.balance || 0, moneda)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-4 h-4 text-yellow-600" />
              </div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Pendientes</h2>
            </div>
            <Link href="/pedidos" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              Ver todos <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {pedidosPendientes.length === 0 ? (
            <div className="text-center py-8">
              <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay pedidos pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosPendientes.map((pedido) => (
                <Link
                  key={pedido.$id}
                  href={`/pedidos/${pedido.$id}`}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getEstadoBgColor(pedido.estado)}`}>
                      <FiClock className={`w-5 h-5 ${getEstadoIconColor(pedido.estado)}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{pedido.cliente}</p>
                      <p className="text-xs text-gray-500">{pedido.numeroFactura}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{formatMoneda(pedido.total, moneda)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getEstadoColor(pedido.estado)}`}>
                      {getEstadoLabel(pedido.estado)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Mini gráfica para el dashboard
function MiniChart({ datos }: { datos: DatoGrafica[] }) {
  if (datos.length === 0) return null;

  const datosActivos = datos.filter((d, i) => d.ingresos > 0 || d.egresos > 0 || i >= datos.length - 10);
  const datosParaGrafica = datosActivos.length > 0 ? datosActivos : datos.slice(-10);

  const valores = datosParaGrafica.map(d => d.balanceAcumulado);
  const minVal = Math.min(...valores, 0);
  const maxVal = Math.max(...valores, 1);
  const range = maxVal - minVal || 1;

  const width = 100;
  const height = 40;
  const padding = 2;

  const points = datosParaGrafica.map((d, i) => {
    const x = padding + (i / (datosParaGrafica.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((d.balanceAcumulado - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const isPositive = (valores[valores.length - 1] || 0) >= 0;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="miniGreenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="miniRedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path 
        d={`${linePath} L ${points[points.length - 1]?.x || 0} ${height} L ${padding} ${height} Z`} 
        fill={`url(#${isPositive ? 'miniGreenGradient' : 'miniRedGradient'})`} 
      />
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="0.5" strokeLinecap="round" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1" fill={lineColor} />
      )}
    </svg>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple';
}) {
  const bgColors = {
    green: 'bg-green-50',
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
  };
  
  const borderColors = {
    green: 'border-green-100',
    red: 'border-red-100',
    blue: 'border-blue-100',
    purple: 'border-purple-100',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-3 md:p-5 border ${borderColors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${bgColors[color]} flex items-center justify-center flex-shrink-0 ml-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getEstadoColor(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'en_proceso':
      return 'bg-blue-100 text-blue-800';
    case 'listo':
      return 'bg-green-100 text-green-800';
    case 'entregado':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getEstadoBgColor(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100';
    case 'en_proceso':
      return 'bg-blue-100';
    case 'listo':
      return 'bg-green-100';
    default:
      return 'bg-gray-100';
  }
}

function getEstadoIconColor(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'text-yellow-600';
    case 'en_proceso':
      return 'text-blue-600';
    case 'listo':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'en_proceso':
      return 'En Proceso';
    case 'listo':
      return 'Listo';
    case 'entregado':
      return 'Entregado';
    default:
      return estado;
  }
}
