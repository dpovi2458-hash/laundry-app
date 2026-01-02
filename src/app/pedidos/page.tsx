'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FiSearch, FiCheck, FiClock, FiEye, FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getPedidos, updatePedido, getConfiguracion } from '@/lib/store';
import { formatMoneda, formatFecha, getHoy } from '@/lib/utils';
import { Pedido, Configuracion } from '@/types';
import { abrirWhatsApp, getMensajePedidoListo } from '@/lib/whatsapp';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'activos' | 'entregados'>('activos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [data, configData] = await Promise.all([
      getPedidos(),
      getConfiguracion(),
    ]);
    setPedidos(data.sort((a, b) => 
      new Date(b.createdAt || b.fechaRecepcion).getTime() - new Date(a.createdAt || a.fechaRecepcion).getTime()
    ));
    setConfig(configData);
    setIsLoading(false);
  }

  async function marcarListo(pedido: Pedido) {
    await updatePedido(pedido.$id!, { estado: 'listo' });
    loadData();
  }

  async function marcarEntregado(pedido: Pedido) {
    await updatePedido(pedido.$id!, { 
      estado: 'entregado',
      fechaEntrega: getHoy()
    });
    loadData();
  }

  const moneda = config?.moneda || 'S/';

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    // Filtro por texto
    if (busqueda) {
      const search = busqueda.toLowerCase();
      if (!p.cliente.toLowerCase().includes(search) && 
          !p.numeroFactura.toLowerCase().includes(search)) {
        return false;
      }
    }
    // Filtro por estado
    if (filtro === 'activos') {
      return p.estado !== 'entregado';
    }
    return p.estado === 'entregado';
  });

  // Agrupar por estado
  const pendientes = pedidosFiltrados.filter(p => p.estado === 'pendiente');
  const enProceso = pedidosFiltrados.filter(p => p.estado === 'en_proceso');
  const listos = pedidosFiltrados.filter(p => p.estado === 'listo');
  const entregados = pedidosFiltrados.filter(p => p.estado === 'entregado');

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
            <h1 className="text-xl font-bold text-slate-900">Mis Pedidos</h1>
            <p className="text-sm text-slate-500">{pedidos.length} total</p>
          </div>
          <Link
            href="/nuevo-pedido"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
          >
            + Nuevo
          </Link>
        </div>

        {/* Búsqueda simple */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Toggle activos/entregados */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFiltro('activos')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              filtro === 'activos'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            🔄 Activos ({pedidos.filter(p => p.estado !== 'entregado').length})
          </button>
          <button
            onClick={() => setFiltro('entregados')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              filtro === 'entregados'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            ✅ Entregados ({pedidos.filter(p => p.estado === 'entregado').length})
          </button>
        </div>

        {/* Pedidos activos */}
        {filtro === 'activos' && (
          <>
            {/* Listos para entregar */}
            {listos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                  ✅ Listos para entregar ({listos.length})
                </h3>
                {listos.map((pedido) => (
                  <PedidoCard
                    key={pedido.$id}
                    pedido={pedido}
                    moneda={moneda}
                    config={config}
                    onMarcarEntregado={() => marcarEntregado(pedido)}
                    estadoColor="bg-emerald-50 border-emerald-200"
                  />
                ))}
              </div>
            )}

            {/* En proceso */}
            {enProceso.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-blue-700 flex items-center gap-2">
                  🔄 En proceso ({enProceso.length})
                </h3>
                {enProceso.map((pedido) => (
                  <PedidoCard
                    key={pedido.$id}
                    pedido={pedido}
                    moneda={moneda}
                    config={config}
                    onMarcarListo={() => marcarListo(pedido)}
                    estadoColor="bg-blue-50 border-blue-200"
                  />
                ))}
              </div>
            )}

            {/* Pendientes */}
            {pendientes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-amber-700 flex items-center gap-2">
                  ⏳ Por iniciar ({pendientes.length})
                </h3>
                {pendientes.map((pedido) => (
                  <PedidoCard
                    key={pedido.$id}
                    pedido={pedido}
                    moneda={moneda}
                    config={config}
                    onMarcarListo={() => marcarListo(pedido)}
                    estadoColor="bg-amber-50 border-amber-200"
                  />
                ))}
              </div>
            )}

            {pedidosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-slate-600 font-medium">¡Todo al día!</p>
                <p className="text-slate-400 text-sm">No hay pedidos pendientes</p>
              </div>
            )}
          </>
        )}

        {/* Pedidos entregados */}
        {filtro === 'entregados' && (
          <div className="space-y-2">
            {entregados.length > 0 ? (
              entregados.slice(0, 20).map((pedido) => (
                <Link
                  key={pedido.$id}
                  href={`/pedidos/${pedido.$id}`}
                  className="block bg-white rounded-xl p-4 border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{pedido.cliente}</p>
                      <p className="text-sm text-slate-500">
                        {formatFecha(pedido.fechaEntrega || pedido.fechaRecepcion)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">{formatMoneda(pedido.total, moneda)}</p>
                      <span className="text-xs text-slate-400">✅ Entregado</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No hay pedidos entregados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PedidoCard({
  pedido,
  moneda,
  config,
  onMarcarListo,
  onMarcarEntregado,
  estadoColor
}: {
  pedido: Pedido;
  moneda: string;
  config: Configuracion | null;
  onMarcarListo?: () => void;
  onMarcarEntregado?: () => void;
  estadoColor: string;
}) {
  return (
    <div className={`rounded-xl p-4 border-2 ${estadoColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-slate-900">{pedido.cliente}</p>
          <p className="text-sm text-slate-500">{formatFecha(pedido.fechaRecepcion)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-indigo-600">{formatMoneda(pedido.total, moneda)}</p>
        </div>
      </div>

      {/* Servicios resumidos */}
      <p className="text-sm text-slate-600 mb-3">
        {pedido.servicios.map(s => `${s.servicioNombre} (×${s.cantidad})`).join(', ')}
      </p>

      {/* Acciones */}
      <div className="flex gap-2">
        {pedido.estado === 'listo' && onMarcarEntregado && (
          <>
            {pedido.telefono && config && (
              <button
                onClick={() => abrirWhatsApp(pedido.telefono!, getMensajePedidoListo(pedido, config))}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="w-5 h-5" />
                Avisar
              </button>
            )}
            <button
              onClick={onMarcarEntregado}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiCheck className="w-5 h-5" />
              Entregado
            </button>
          </>
        )}

        {(pedido.estado === 'pendiente' || pedido.estado === 'en_proceso') && onMarcarListo && (
          <>
            <button
              onClick={onMarcarListo}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiCheck className="w-5 h-5" />
              Listo para entregar
            </button>
            <Link
              href={`/pedidos/${pedido.$id}`}
              className="py-3 px-4 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"
            >
              <FiEye className="w-5 h-5" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
