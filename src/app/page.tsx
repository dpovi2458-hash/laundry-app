'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';
import { getResumenDiario, getResumenPorRango, getPedidos, getConfiguracion } from '@/lib/store';
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

export default function HomePage() {
  const [resumenHoy, setResumenHoy] = useState<Resumen | null>(null);
  const [resumenSemana, setResumenSemana] = useState<Resumen | null>(null);
  const [resumenMes, setResumenMes] = useState<Resumen | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [isLoading, setIsLoading] = useState(true);

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

    const [resHoy, resSemana, resMes, allPedidos] = await Promise.all([
      getResumenDiario(hoy),
      getResumenPorRango(inicioSemana, finSemana),
      getResumenPorRango(inicioMes, finMes),
      getPedidos(),
    ]);

    setResumenHoy(resHoy);
    setResumenSemana(resSemana);
    setResumenMes(resMes);

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
            className="w-full md:w-auto text-center inline-flex items-center justify-center px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FiShoppingBag className="mr-2" />
            Nuevo Pedido
          </Link>
        </div>

        {/* Stats Cards - Hoy - 2x2 en móvil */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Ingresos"
            value={formatMoneda(resumenHoy?.ingresos || 0, moneda)}
            icon={<FiTrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />}
            color="green"
          />
          <StatCard
            title="Egresos"
            value={formatMoneda(resumenHoy?.egresos || 0, moneda)}
            icon={<FiTrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />}
            color="red"
          />
          <StatCard
            title="Balance"
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
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Esta Semana</h2>
            <div className="space-y-2 md:space-y-3">
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
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-800 font-medium">Balance</span>
                <span className={`font-bold ${(resumenSemana?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(resumenSemana?.balance || 0, moneda)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen Mensual */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{getNombreMes()}</h2>
            <div className="space-y-2 md:space-y-3">
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
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-800 font-medium">Balance</span>
                <span className={`font-bold ${(resumenMes?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(resumenMes?.balance || 0, moneda)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Pendientes</h2>
            <Link href="/pedidos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos →
            </Link>
          </div>
          
          {pedidosPendientes.length === 0 ? (
            <p className="text-gray-500 text-center py-6 text-sm">No hay pedidos pendientes</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {pedidosPendientes.map((pedido) => (
                <Link
                  key={pedido.$id}
                  href={`/pedidos/${pedido.$id}`}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg ${bgColors[color]} flex items-center justify-center flex-shrink-0 ml-2`}>
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
