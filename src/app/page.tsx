'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  FiShoppingBag, 
  FiClock, 
  FiCheck,
  FiDollarSign,
  FiArrowRight,
  FiPhone
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { 
  getResumenDiario, 
  getPedidos, 
  getConfiguracion,
  updatePedido
} from '@/lib/store';
import { 
  getHoy, 
  formatMoneda, 
  formatFecha
} from '@/lib/utils';
import Link from 'next/link';
import { Pedido, Configuracion } from '@/types';
import { abrirWhatsApp, getMensajePedidoListo } from '@/lib/whatsapp';

export default function HomePage() {
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [pedidosListos, setPedidosListos] = useState<Pedido[]>([]);
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [configData, resumenHoy, allPedidos] = await Promise.all([
      getConfiguracion(),
      getResumenDiario(getHoy()),
      getPedidos(),
    ]);

    setConfig(configData);
    setIngresosHoy(resumenHoy.ingresos);

    // Separar pedidos por estado
    const pendientes = allPedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso');
    const listos = allPedidos.filter(p => p.estado === 'listo');

    setPedidosPendientes(pendientes.sort((a, b) => 
      new Date(a.fechaRecepcion).getTime() - new Date(b.fechaRecepcion).getTime()
    ));
    setPedidosListos(listos);
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const moneda = config?.moneda || 'S/';

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-20">
        {/* Saludo simple */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">¡Hola! 👋</h1>
            <p className="text-slate-500 text-sm">{formatFecha(getHoy())}</p>
          </div>
        </div>

        {/* Botón grande de nuevo pedido */}
        <Link
          href="/nuevo-pedido"
          className="block w-full p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Crear Pedido</p>
                <p className="text-white/80 text-sm">Toca aquí para empezar</p>
              </div>
            </div>
            <FiArrowRight className="w-6 h-6" />
          </div>
        </Link>

        {/* Resumen del día - Simple */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-emerald-600">{formatMoneda(ingresosHoy, moneda)}</p>
            <p className="text-xs text-slate-500">Ganaste hoy</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-amber-600">{pedidosPendientes.length}</p>
            <p className="text-xs text-slate-500">En proceso</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-blue-600">{pedidosListos.length}</p>
            <p className="text-xs text-slate-500">Listos</p>
          </div>
        </div>

        {/* Pedidos LISTOS para entregar - Lo más importante */}
        {pedidosListos.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200">
            <h2 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <FiCheck className="w-5 h-5" />
              ¡Listos para entregar! ({pedidosListos.length})
            </h2>
            <div className="space-y-2">
              {pedidosListos.map((pedido) => (
                <div
                  key={pedido.$id}
                  className="bg-white rounded-xl p-4 border border-emerald-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900">{pedido.cliente}</p>
                      <p className="text-sm text-slate-500">{formatMoneda(pedido.total, moneda)}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      ✓ Listo
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {pedido.telefono && (
                      <button
                        onClick={() => abrirWhatsApp(pedido.telefono!, getMensajePedidoListo(pedido, config!))}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium active:scale-[0.98]"
                      >
                        <FaWhatsapp className="w-5 h-5" />
                        Avisar
                      </button>
                    )}
                    <button
                      onClick={() => marcarEntregado(pedido)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-medium active:scale-[0.98]"
                    >
                      <FiCheck className="w-5 h-5" />
                      Entregado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos en proceso */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-amber-500" />
              En Proceso ({pedidosPendientes.length})
            </h2>
            <Link href="/pedidos" className="text-indigo-600 text-sm font-medium">
              Ver todo →
            </Link>
          </div>

          {pedidosPendientes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <FiShoppingBag className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">¡Todo limpio! 🎉</p>
              <p className="text-slate-400 text-sm">No hay pedidos pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pedidosPendientes.slice(0, 5).map((pedido) => (
                <div key={pedido.$id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        pedido.estado === 'en_proceso' ? 'bg-blue-100' : 'bg-amber-100'
                      }`}>
                        <FiClock className={`w-5 h-5 ${
                          pedido.estado === 'en_proceso' ? 'text-blue-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{pedido.cliente}</p>
                        <p className="text-sm text-slate-500">
                          {pedido.estado === 'en_proceso' ? '🔄 Lavando...' : '⏳ Por iniciar'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{formatMoneda(pedido.total, moneda)}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => marcarListo(pedido)}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-200 active:bg-emerald-100 transition-colors"
                  >
                    ✓ Marcar como Listo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acceso rápido */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/finanzas"
            className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3 active:bg-slate-50"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Ver Dinero</p>
              <p className="text-xs text-slate-500">Ingresos y gastos</p>
            </div>
          </Link>
          <Link
            href="/configuracion"
            className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3 active:bg-slate-50"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Ajustes</p>
              <p className="text-xs text-slate-500">Configurar app</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
