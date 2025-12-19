'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiMinus, FiTrash2, FiPrinter } from 'react-icons/fi';
import { getServicios, createPedido, createIngreso, getConfiguracion } from '@/lib/store';
import { formatMoneda, getHoy } from '@/lib/utils';
import { Servicio, ServicioPedido } from '@/types';

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [carrito, setCarrito] = useState<ServicioPedido[]>([]);
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'yape' | 'plin' | 'transferencia'>('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');

  useEffect(() => {
    async function loadData() {
      const [serviciosData, config] = await Promise.all([
        getServicios(),
        getConfiguracion(),
      ]);
      setServicios(serviciosData.filter(s => s.activo));
      setMoneda(config.moneda);
    }
    loadData();
  }, []);

  function agregarAlCarrito(servicio: Servicio) {
    const existe = carrito.find(item => item.servicioId === servicio.$id);
    
    if (existe) {
      setCarrito(carrito.map(item => 
        item.servicioId === servicio.$id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioUnitario }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        servicioId: servicio.$id!,
        servicioNombre: servicio.nombre,
        cantidad: 1,
        precioUnitario: servicio.precio,
        subtotal: servicio.precio,
      }]);
    }
  }

  function actualizarCantidad(servicioId: string, cantidad: number) {
    if (cantidad <= 0) {
      eliminarDelCarrito(servicioId);
      return;
    }
    
    setCarrito(carrito.map(item =>
      item.servicioId === servicioId
        ? { ...item, cantidad, subtotal: cantidad * item.precioUnitario }
        : item
    ));
  }

  function eliminarDelCarrito(servicioId: string) {
    setCarrito(carrito.filter(item => item.servicioId !== servicioId));
  }

  const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - descuento;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (carrito.length === 0) {
      alert('Agrega al menos un servicio');
      return;
    }

    if (!cliente.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    const pedido = await createPedido({
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      servicios: carrito,
      subtotal,
      descuento,
      total,
      estado: 'pendiente',
      metodoPago,
      notas: notas.trim(),
      fechaRecepcion: getHoy(),
      fechaEntrega: fechaEntrega || undefined,
    });

    // Registrar ingreso
    await createIngreso({
      concepto: `Pedido ${pedido.numeroFactura} - ${cliente}`,
      monto: total,
      categoria: 'pedido',
      pedidoId: pedido.$id,
      fecha: getHoy(),
    });

    router.push(`/pedidos/${pedido.$id}?print=true`);
  }

  function getUnidadLabel(servicio: Servicio): string {
    switch (servicio.unidad) {
      case 'kg': return '/kg';
      case 'prenda': return '/prenda';
      case 'unidad': return '/unidad';
      default: return '';
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
          <p className="text-sm text-gray-500">Registra un nuevo pedido</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Carrito / Resumen - PRIMERO en móvil cuando hay items */}
          {carrito.length > 0 && (
            <div className="lg:hidden order-first">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">{carrito.length} servicio(s)</p>
                    <p className="text-xl font-bold text-blue-800">{formatMoneda(total, moneda)}</p>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiPrinter className="w-4 h-4" />
                    Crear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Servicios disponibles */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Servicios</h2>
              <div className="grid grid-cols-1 gap-2 md:gap-3">
                {servicios.map((servicio) => (
                  <button
                    key={servicio.$id}
                    type="button"
                    onClick={() => agregarAlCarrito(servicio)}
                    className="flex items-center justify-between p-3 md:p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left active:bg-blue-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{servicio.nombre}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{servicio.descripcion}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold text-blue-600">
                        {formatMoneda(servicio.precio, moneda)}
                      </p>
                      <p className="text-xs text-gray-400">{getUnidadLabel(servicio)}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {servicios.length === 0 && (
                <p className="text-gray-500 text-center py-6 text-sm">
                  No hay servicios activos.
                </p>
              )}
            </div>

            {/* Datos del cliente */}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Cliente</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="999 999 999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as typeof metodoPago)}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrega
                  </label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    min={getHoy()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Carrito / Resumen - Desktop */}
          <div className="lg:col-span-1 order-3 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:sticky lg:top-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Resumen</h2>
              
              {carrito.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">
                  Toca un servicio para agregar
                </p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {carrito.map((item) => (
                    <div key={item.servicioId} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.servicioNombre}</p>
                        <p className="text-xs text-gray-500">
                          {formatMoneda(item.precioUnitario, moneda)} × {item.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item.servicioId, item.cantidad - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidad(item.servicioId, parseFloat(e.target.value) || 0)}
                          className="w-12 text-center border rounded-lg py-1 text-sm"
                          step="0.5"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item.servicioId, item.cantidad + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.servicioId)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <hr className="my-2" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatMoneda(subtotal, moneda)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Descuento</label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{moneda}</span>
                        <input
                          type="number"
                          value={descuento}
                          onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                          className="w-16 text-right border rounded-lg py-1 px-2 text-sm"
                          min="0"
                          step="0.50"
                        />
                      </div>
                    </div>

                    <hr />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatMoneda(total, moneda)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <FiPrinter className="w-5 h-5" />
                    Crear e Imprimir
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
