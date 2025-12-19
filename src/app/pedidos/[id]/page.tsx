'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPrinter, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import { getPedidoById, updatePedido, getConfiguracion } from '@/lib/store';
import { formatMoneda, formatFecha, formatFechaHora } from '@/lib/utils';
import { Pedido, Configuracion } from '@/types';

export default function DetallePedidoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const id = params.id as string;
      const [pedidoData, configData] = await Promise.all([
        getPedidoById(id),
        getConfiguracion(),
      ]);
      
      setPedido(pedidoData || null);
      setConfig(configData);
      setIsLoading(false);

      // Auto print if coming from new order
      if (searchParams.get('print') === 'true' && pedidoData) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    }
    loadData();
  }, [params.id, searchParams]);

  function handlePrint() {
    window.print();
  }

  async function handleCambiarEstado(nuevoEstado: string) {
    if (pedido) {
      await updatePedido(pedido.$id!, { estado: nuevoEstado as Pedido['estado'] });
      setPedido({ ...pedido, estado: nuevoEstado as Pedido['estado'] });
    }
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

  function getMetodoPagoLabel(metodo: string): string {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'yape': return 'Yape';
      case 'plin': return 'Plin';
      case 'transferencia': return 'Transferencia';
      default: return metodo;
    }
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

  if (!pedido) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Pedido no encontrado</p>
          <Link href="/pedidos" className="text-blue-600 hover:text-blue-700">
            Volver a pedidos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const moneda = config?.moneda || 'S/';

  return (
    <>
      {/* Vista normal con layout */}
      <div className="no-print">
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/pedidos"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                    {pedido.numeroFactura}
                  </h1>
                  <p className="text-sm text-gray-500">{pedido.cliente}</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 md:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <FiPrinter className="mr-2" />
                Imprimir
              </button>
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4">
              {/* Info lateral - primero en móvil */}
              <div className="space-y-4 lg:order-2">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Estado</h2>
                  <select
                    value={pedido.estado}
                    onChange={(e) => handleCambiarEstado(e.target.value)}
                    className={`w-full px-4 py-3 md:py-2 rounded-lg text-center font-medium border-0 text-base ${getEstadoColor(pedido.estado)}`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="listo">Listo</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="font-medium text-sm">{pedido.cliente}</p>
                  </div>
                  {pedido.telefono && (
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="font-medium text-sm">{pedido.telefono}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Recepción</p>
                    <p className="font-medium text-sm">{formatFecha(pedido.fechaRecepcion)}</p>
                  </div>
                  {pedido.fechaEntrega && (
                    <div>
                      <p className="text-xs text-gray-500">Entrega</p>
                      <p className="font-medium text-sm">{formatFecha(pedido.fechaEntrega)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Pago</p>
                    <p className="font-medium text-sm">{getMetodoPagoLabel(pedido.metodoPago)}</p>
                  </div>
                </div>
              </div>

              {/* Detalle del pedido */}
              <div className="lg:col-span-2 space-y-4 lg:order-1">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios</h2>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Servicio</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-500">Cant.</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-500">Precio</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.servicios.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3">{item.servicioNombre}</td>
                          <td className="py-3 text-center">{item.cantidad}</td>
                          <td className="py-3 text-right">{formatMoneda(item.precioUnitario, moneda)}</td>
                          <td className="py-3 text-right font-medium">{formatMoneda(item.subtotal, moneda)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-gray-600">Subtotal</td>
                        <td className="py-2 text-right">{formatMoneda(pedido.subtotal, moneda)}</td>
                      </tr>
                      {pedido.descuento > 0 && (
                        <tr>
                          <td colSpan={3} className="py-2 text-right text-gray-600">Descuento</td>
                          <td className="py-2 text-right text-red-600">-{formatMoneda(pedido.descuento, moneda)}</td>
                        </tr>
                      )}
                      <tr className="font-bold text-lg">
                        <td colSpan={3} className="py-2 text-right">Total</td>
                        <td className="py-2 text-right text-blue-600">{formatMoneda(pedido.total, moneda)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {pedido.notas && (
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">Notas</h2>
                    <p className="text-gray-600 text-sm">{pedido.notas}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </div>

      {/* Factura para imprimir - Blanco y Negro */}
      <div className="print-only" ref={printRef}>
        <div className="p-4 max-w-[80mm] mx-auto font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-4 border-b-2 border-black border-dashed pb-4">
            <h1 className="text-lg font-bold uppercase">{config?.nombreNegocio}</h1>
            {config?.ruc && <p className="text-xs">RUC: {config.ruc}</p>}
            <p className="text-xs">{config?.direccion}</p>
            <p className="text-xs">Tel: {config?.telefono}</p>
          </div>

          {/* Factura info */}
          <div className="text-center mb-4">
            <p className="font-bold">COMPROBANTE DE PAGO</p>
            <p className="text-xs">{pedido.numeroFactura}</p>
            <p className="text-xs">{formatFechaHora(pedido.createdAt || pedido.fechaRecepcion)}</p>
          </div>

          {/* Cliente */}
          <div className="mb-4 border-b border-dashed border-gray-400 pb-2">
            <p><strong>Cliente:</strong> {pedido.cliente}</p>
            {pedido.telefono && <p><strong>Tel:</strong> {pedido.telefono}</p>}
          </div>

          {/* Items */}
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left text-xs py-1">ITEM</th>
                <th className="text-center text-xs py-1">CANT</th>
                <th className="text-right text-xs py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {pedido.servicios.map((item, index) => (
                <tr key={index} className="border-b border-dotted border-gray-300">
                  <td className="py-1 text-xs">{item.servicioNombre}</td>
                  <td className="py-1 text-center text-xs">{item.cantidad}</td>
                  <td className="py-1 text-right text-xs">{formatMoneda(item.subtotal, moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="border-t-2 border-black border-dashed pt-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatMoneda(pedido.subtotal, moneda)}</span>
            </div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between">
                <span>Descuento:</span>
                <span>-{formatMoneda(pedido.descuento, moneda)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-black mt-1 pt-1">
              <span>TOTAL:</span>
              <span>{formatMoneda(pedido.total, moneda)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Pago:</span>
              <span>{getMetodoPagoLabel(pedido.metodoPago)}</span>
            </div>
          </div>

          {/* Fecha entrega */}
          {pedido.fechaEntrega && (
            <div className="text-center mb-4 p-2 border border-black">
              <p className="font-bold">FECHA DE ENTREGA</p>
              <p>{formatFecha(pedido.fechaEntrega)}</p>
            </div>
          )}

          {/* Notas */}
          {pedido.notas && (
            <div className="text-xs mb-4 italic">
              <p>Nota: {pedido.notas}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs border-t-2 border-black border-dashed pt-4">
            <p className="font-bold">{config?.mensajeFactura || '¡Gracias por su preferencia!'}</p>
            <p className="mt-2">Conserve este comprobante</p>
          </div>
        </div>
      </div>
    </>
  );
}
