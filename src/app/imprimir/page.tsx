'use client';

import { useEffect, useState } from 'react';
import { FiPrinter, FiCheck, FiSave, FiCheckCircle } from 'react-icons/fi';
import { getPedidos, getConfiguracion, createFacturaImpresa } from '@/lib/store';
import { formatMoneda, formatFecha } from '@/lib/utils';
import { Pedido, Configuracion } from '@/types';
import Link from 'next/link';

export default function ImprimirMultiplePage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [moneda, setMoneda] = useState('S/');
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [data, configData] = await Promise.all([
        getPedidos(),
        getConfiguracion(),
      ]);
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt || b.fechaRecepcion).getTime() - new Date(a.createdAt || a.fechaRecepcion).getTime()
      );
      setPedidos(sorted);
      setConfig(configData);
      setMoneda(configData.moneda);
    }
    loadData();
  }, []);

  function toggleSeleccion(id: string) {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(s => s !== id));
    } else if (seleccionados.length < 4) {
      setSeleccionados([...seleccionados, id]);
    }
  }

  async function guardarYPrintear() {
    setGuardando(true);
    
    // Guardar registro de impresión en la base de datos
    const pedidosSeleccionados = pedidos.filter(p => seleccionados.includes(p.$id!));
    
    for (const pedido of pedidosSeleccionados) {
      await createFacturaImpresa({
        pedidoId: pedido.$id!,
        numeroFactura: pedido.numeroFactura,
        cliente: pedido.cliente,
        total: pedido.total,
      });
    }
    
    setGuardando(false);
    setGuardadoExitoso(true);
    
    // Mostrar mensaje de éxito brevemente y luego imprimir
    setTimeout(() => {
      window.print();
      setGuardadoExitoso(false);
    }, 500);
  }

  const pedidosSeleccionados = pedidos.filter(p => seleccionados.includes(p.$id!));

  return (
    <>
      {/* Panel de selección - NO se imprime */}
      <div className="no-print min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Imprimir Facturas</h1>
              <p className="text-sm text-gray-500">Selecciona hasta 4 pedidos para imprimir en A4</p>
            </div>
            <Link
              href="/facturas"
              className="text-center px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Volver
            </Link>
          </div>

          {/* Contador y botón de impresión */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{seleccionados.length}/4</span>
              </div>
              <span className="text-blue-800 font-medium">
                Facturas seleccionadas
              </span>
            </div>
            {seleccionados.length > 0 && (
              <button
                onClick={guardarYPrintear}
                disabled={guardando}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-medium transition-all active:scale-[0.98] ${
                  guardadoExitoso 
                    ? 'bg-green-500' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } ${guardando ? 'opacity-70 cursor-wait' : ''}`}
              >
                {guardadoExitoso ? (
                  <>
                    <FiCheckCircle className="mr-2 w-5 h-5" />
                    ¡Guardado!
                  </>
                ) : guardando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiPrinter className="mr-2 w-5 h-5" />
                    Guardar e Imprimir ({seleccionados.length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* Lista de pedidos */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Vista móvil - Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {pedidos.map((pedido) => {
                const isSelected = seleccionados.includes(pedido.$id!);
                const isDisabled = !isSelected && seleccionados.length >= 4;
                
                return (
                  <div 
                    key={pedido.$id} 
                    onClick={() => !isDisabled && toggleSeleccion(pedido.$id!)}
                    className={`p-4 flex items-center gap-4 transition-colors active:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : isDisabled ? 'bg-gray-100 opacity-50' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{pedido.cliente}</p>
                      <p className="text-xs text-gray-500">{pedido.numeroFactura} • {formatFecha(pedido.fechaRecepcion)}</p>
                    </div>
                    <span className="font-bold text-gray-900">{formatMoneda(pedido.total, moneda)}</span>
                  </div>
                );
              })}
            </div>

            {/* Vista desktop - Tabla */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedidos.map((pedido) => {
                  const isSelected = seleccionados.includes(pedido.$id!);
                  const isDisabled = !isSelected && seleccionados.length >= 4;
                  
                  return (
                    <tr 
                      key={pedido.$id} 
                      onClick={() => !isDisabled && toggleSeleccion(pedido.$id!)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : isDisabled ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{pedido.numeroFactura}</td>
                      <td className="px-4 py-3 font-medium">{pedido.cliente}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatFecha(pedido.fechaRecepcion)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoneda(pedido.total, moneda)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pedidos.length === 0 && (
              <p className="text-center py-12 text-gray-500">No hay pedidos para imprimir</p>
            )}
          </div>
        </div>
      </div>

      {/* Área de impresión - 4 facturas en A4 */}
      <div className="print-area">
        <div className="print-grid">
          {pedidosSeleccionados.map((pedido, index) => (
            <FacturaMini key={pedido.$id} pedido={pedido} config={config} moneda={moneda} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-area,
          .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            padding: 5mm;
          }
          
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 5mm;
            width: 100%;
            height: 100%;
          }
          
          .factura-mini {
            border: 1px dashed #999;
            padding: 3mm;
            font-size: 8pt;
            font-family: 'Courier New', monospace;
            overflow: hidden;
            page-break-inside: avoid;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
        
        @media screen {
          .print-area {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

function FacturaMini({ pedido, config, moneda }: { pedido: Pedido; config: Configuracion | null; moneda: string }) {
  return (
    <div className="factura-mini">
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>{config?.nombreNegocio}</div>
        {config?.ruc && <div style={{ fontSize: '7pt' }}>RUC: {config.ruc}</div>}
        <div style={{ fontSize: '7pt' }}>{config?.direccion}</div>
        <div style={{ fontSize: '7pt' }}>Tel: {config?.telefono}</div>
      </div>

      {/* Factura info */}
      <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
        <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>COMPROBANTE</div>
        <div style={{ fontSize: '7pt' }}>{pedido.numeroFactura}</div>
        <div style={{ fontSize: '7pt' }}>{formatFecha(pedido.fechaRecepcion)}</div>
      </div>

      {/* Cliente */}
      <div style={{ borderBottom: '1px dotted #999', paddingBottom: '1mm', marginBottom: '1mm', fontSize: '7pt' }}>
        <strong>Cliente:</strong> {pedido.cliente}
        {pedido.telefono && <span> | Tel: {pedido.telefono}</span>}
      </div>

      {/* Items */}
      <table style={{ width: '100%', fontSize: '7pt', marginBottom: '2mm' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '1mm 0' }}>Serv.</th>
            <th style={{ textAlign: 'center', padding: '1mm 0' }}>Cant</th>
            <th style={{ textAlign: 'right', padding: '1mm 0' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {pedido.servicios.slice(0, 5).map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '0.5mm 0' }}>{item.servicioNombre.substring(0, 15)}</td>
              <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ textAlign: 'right' }}>{formatMoneda(item.subtotal, moneda)}</td>
            </tr>
          ))}
          {pedido.servicios.length > 5 && (
            <tr><td colSpan={3} style={{ fontSize: '6pt', color: '#666' }}>+{pedido.servicios.length - 5} más...</td></tr>
          )}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '1mm' }}>
        {pedido.descuento > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7pt' }}>
            <span>Desc:</span>
            <span>-{formatMoneda(pedido.descuento, moneda)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10pt' }}>
          <span>TOTAL:</span>
          <span>{formatMoneda(pedido.total, moneda)}</span>
        </div>
        <div style={{ fontSize: '6pt', textAlign: 'right' }}>Pago: {pedido.metodoPago}</div>
      </div>

      {/* Fecha entrega */}
      {pedido.fechaEntrega && (
        <div style={{ textAlign: 'center', margin: '1mm 0', padding: '1mm', border: '1px solid #000', fontSize: '7pt' }}>
          <strong>ENTREGA:</strong> {formatFecha(pedido.fechaEntrega)}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '6pt', marginTop: '1mm', borderTop: '1px dashed #000', paddingTop: '1mm' }}>
        {config?.mensajeFactura}
      </div>
    </div>
  );
}
