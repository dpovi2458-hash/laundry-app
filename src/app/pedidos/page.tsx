'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FiEye, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { getPedidos, deletePedido, updatePedido, getConfiguracion } from '@/lib/store';
import { formatMoneda, formatFecha } from '@/lib/utils';
import { Pedido } from '@/types';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filtrarPedidos();
  }, [busqueda, filtroEstado, pedidos]);

  async function loadData() {
    const [data, config] = await Promise.all([
      getPedidos(),
      getConfiguracion(),
    ]);
    const sorted = data.sort((a, b) => 
      new Date(b.createdAt || b.fechaRecepcion).getTime() - new Date(a.createdAt || a.fechaRecepcion).getTime()
    );
    setPedidos(sorted);
    setMoneda(config.moneda);
  }

  function filtrarPedidos() {
    let filtered = [...pedidos];

    if (busqueda) {
      const search = busqueda.toLowerCase();
      filtered = filtered.filter(p => 
        p.cliente.toLowerCase().includes(search) ||
        p.numeroFactura.toLowerCase().includes(search) ||
        p.telefono?.toLowerCase().includes(search)
      );
    }

    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(p => p.estado === filtroEstado);
    }

    setFilteredPedidos(filtered);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      await deletePedido(id);
      await loadData();
    }
  }

  async function handleCambiarEstado(pedido: Pedido, nuevoEstado: string) {
    await updatePedido(pedido.$id!, { estado: nuevoEstado as Pedido['estado'] });
    await loadData();
  }

  function getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'listo': return 'bg-green-100 text-green-800';
      case 'entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En Proceso';
      case 'listo': return 'Listo';
      case 'entregado': return 'Entregado';
      default: return estado;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-sm text-gray-500">Gestiona todos los pedidos</p>
          </div>
          <Link
            href="/nuevo-pedido"
            className="w-full md:w-auto text-center inline-flex items-center justify-center px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Nuevo Pedido
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente o factura..."
                className="w-full pl-10 pr-4 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 flex-shrink-0" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="flex-1 px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="listo">Listo</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de pedidos - Cards en móvil, tabla en desktop */}
        <div className="space-y-3 md:hidden">
          {filteredPedidos.map((pedido) => (
            <div key={pedido.$id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{pedido.cliente}</p>
                  <p className="text-xs text-gray-500 font-mono">{pedido.numeroFactura}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {formatMoneda(pedido.total, moneda)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                <span>{formatFecha(pedido.fechaRecepcion)}</span>
                {pedido.telefono && (
                  <>
                    <span>•</span>
                    <span>{pedido.telefono}</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <select
                  value={pedido.estado}
                  onChange={(e) => handleCambiarEstado(pedido, e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${getEstadoColor(pedido.estado)}`}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                </select>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/pedidos/${pedido.$id}`}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiEye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(pedido.$id!)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredPedidos.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500">
                {pedidos.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron pedidos'}
              </p>
            </div>
          )}
        </div>

        {/* Tabla para desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Factura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.$id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">{pedido.numeroFactura}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{pedido.cliente}</p>
                        {pedido.telefono && (
                          <p className="text-sm text-gray-500">{pedido.telefono}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatFecha(pedido.fechaRecepcion)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        {formatMoneda(pedido.total, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => handleCambiarEstado(pedido, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getEstadoColor(pedido.estado)}`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="listo">Listo</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pedidos/${pedido.$id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver detalle"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(pedido.$id!)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPedidos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {pedidos.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron pedidos'}
              </p>
            </div>
          )}
        </div>

        {/* Resumen */}
        {filteredPedidos.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="text-sm text-blue-700">
              {filteredPedidos.length} de {pedidos.length} pedidos
            </span>
            <span className="text-lg font-bold text-blue-800">
              Total: {formatMoneda(filteredPedidos.reduce((sum, p) => sum + p.total, 0), moneda)}
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
