'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPrinter, FiEye, FiSearch } from 'react-icons/fi';
import { getPedidos, getConfiguracion } from '@/lib/store';
import { formatMoneda, formatFecha, getMesesDisponibles, getRangoMes } from '@/lib/utils';
import { Pedido } from '@/types';

export default function FacturasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [busqueda, setBusqueda] = useState('');

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
    
    const todosPedidos = await getPedidos();
    const pedidosFiltrados = todosPedidos
      .filter(p => p.fechaRecepcion >= inicio && p.fechaRecepcion <= fin)
      .sort((a, b) => new Date(b.createdAt || b.fechaRecepcion).getTime() - new Date(a.createdAt || a.fechaRecepcion).getTime());
    
    setPedidos(pedidosFiltrados);
  }

  const pedidosFiltrados = busqueda
    ? pedidos.filter(p =>
        p.numeroFactura.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.cliente.toLowerCase().includes(busqueda.toLowerCase())
      )
    : pedidos;

  const totalFacturado = pedidosFiltrados.reduce((sum, p) => sum + p.total, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
            <p className="text-gray-500">Historial de comprobantes emitidos</p>
          </div>
          <Link
            href="/imprimir"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <FiPrinter className="mr-2" />
            Imprimir Múltiples (4 en A4)
          </Link>
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
        </div>

        {/* Búsqueda y resumen */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative w-full md:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por número de factura o cliente..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {pedidosFiltrados.length} facturas
              </div>
              <div className="text-lg font-bold text-blue-600">
                Total: {formatMoneda(totalFacturado, moneda)}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de facturas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nº Factura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pago
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.$id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {pedido.numeroFactura}
                      </span>
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
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900">
                        {formatMoneda(pedido.total, moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">
                        {pedido.metodoPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pedidos/${pedido.$id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver factura"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/pedidos/${pedido.$id}?print=true`}
                          className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                          title="Imprimir"
                        >
                          <FiPrinter className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pedidosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {pedidos.length === 0 ? 'No hay facturas en este periodo' : 'No se encontraron facturas'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
