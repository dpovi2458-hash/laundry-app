'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FiPlus, FiMinus, FiTrash2, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { getServicios, createPedido, createIngreso, getConfiguracion } from '@/lib/store';
import { formatMoneda, getHoy } from '@/lib/utils';
import { Servicio, ServicioPedido } from '@/types';
import Link from 'next/link';

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [moneda, setMoneda] = useState('S/');
  const [carrito, setCarrito] = useState<ServicioPedido[]>([]);
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'yape' | 'plin' | 'transferencia'>('efectivo');
  const [guardando, setGuardando] = useState(false);

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

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleSubmit() {
    if (carrito.length === 0) {
      alert('⚠️ Agrega al menos un servicio');
      return;
    }
    if (!cliente.trim()) {
      alert('⚠️ Escribe el nombre del cliente');
      return;
    }

    setGuardando(true);
    
    try {
      const pedido = await createPedido({
        cliente: cliente.trim(),
        telefono: telefono.trim(),
        servicios: carrito,
        subtotal: total,
        descuento: 0,
        total,
        estado: 'pendiente',
        metodoPago,
        fechaRecepcion: getHoy(),
      });

      await createIngreso({
        concepto: `Pedido ${pedido.numeroFactura} - ${cliente}`,
        monto: total,
        categoria: 'pedido',
        pedidoId: pedido.$id!,
        fecha: getHoy(),
      });

      router.push(`/pedidos/${pedido.$id}?print=true`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al crear pedido. Intenta de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="pb-32">
        {/* Header simple */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Nuevo Pedido</h1>
        </div>

        {/* Cliente - Lo primero y más simple */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            👤 Nombre del cliente
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej: María García"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
          />
          
          <label className="block text-sm font-medium text-slate-600 mb-2 mt-4">
            📱 Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="999 999 999"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Servicios - Botones grandes y claros */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-3">
            🧺 ¿Qué servicio necesita?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {servicios.map((servicio) => {
              const enCarrito = carrito.find(item => item.servicioId === servicio.$id);
              return (
                <button
                  key={servicio.$id}
                  type="button"
                  onClick={() => agregarAlCarrito(servicio)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                    enCarrito 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{servicio.nombre}</p>
                    <p className="text-sm text-slate-500">{servicio.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-lg">
                      {formatMoneda(servicio.precio, moneda)}
                    </p>
                    {enCarrito && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        ×{enCarrito.cantidad}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen del carrito - Solo si hay items */}
        {carrito.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-3">
              📋 Resumen del pedido
            </label>
            <div className="space-y-2">
              {carrito.map((item) => (
                <div key={item.servicioId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.servicioNombre}</p>
                    <p className="text-sm text-slate-500">
                      {formatMoneda(item.precioUnitario, moneda)} c/u
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizarCantidad(item.servicioId, item.cantidad - 1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center active:bg-slate-300"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.servicioId, item.cantidad + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center active:bg-slate-300"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarDelCarrito(item.servicioId)}
                      className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center active:bg-red-200"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Método de pago */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                💳 ¿Cómo paga?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'efectivo', label: '💵', name: 'Efectivo' },
                  { value: 'yape', label: '📱', name: 'Yape' },
                  { value: 'plin', label: '📲', name: 'Plin' },
                  { value: 'transferencia', label: '🏦', name: 'Transf.' },
                ].map((metodo) => (
                  <button
                    key={metodo.value}
                    onClick={() => setMetodoPago(metodo.value as typeof metodoPago)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      metodoPago === metodo.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className="text-xl">{metodo.label}</span>
                    <p className="text-xs mt-1">{metodo.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón fijo de crear pedido */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-white border-t border-slate-200 p-4 safe-area-bottom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-600">Total a cobrar:</span>
          <span className="text-2xl font-bold text-indigo-600">
            {formatMoneda(total, moneda)}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={guardando || carrito.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            carrito.length === 0
              ? 'bg-slate-200 text-slate-400'
              : 'bg-indigo-600 text-white active:scale-[0.98] shadow-lg shadow-indigo-500/30'
          }`}
        >
          {guardando ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <FiCheck className="w-5 h-5" />
              Crear Pedido
            </>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
}
