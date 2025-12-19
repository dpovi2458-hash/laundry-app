'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiSave, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { getConfiguracion, updateConfiguracion } from '@/lib/store';
import { testConnection } from '@/lib/supabase';
import { Configuracion } from '@/types';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion>({
    $id: '',
    nombreNegocio: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    moneda: 'S/',
    mensajeFactura: '',
  });
  const [saved, setSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [connectionError, setConnectionError] = useState<string>('');

  useEffect(() => {
    async function loadConfig() {
      const configData = await getConfiguracion();
      setConfig(configData);
    }
    loadConfig();
    checkConnection();
  }, []);

  async function checkConnection() {
    setConnectionStatus('testing');
    const result = await testConnection();
    if (result.success) {
      setConnectionStatus('connected');
      setConnectionError('');
    } else {
      setConnectionStatus('error');
      setConnectionError(result.error || 'Error desconocido');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateConfiguracion(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleReset() {
    if (confirm('¿Restablecer la configuración a valores por defecto?')) {
      const defaultConfig: Configuracion = {
        $id: '1',
        nombreNegocio: 'Lavandería Express',
        ruc: '',
        direccion: 'Av. Principal 123, Lima, Perú',
        telefono: '999 999 999',
        email: '',
        moneda: 'S/',
        mensajeFactura: '¡Gracias por su preferencia!',
      };
      await updateConfiguracion(defaultConfig);
      setConfig(defaultConfig);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Personaliza tu lavandería</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-5">
          {/* Datos del Negocio */}
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Datos del Negocio</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={config.nombreNegocio}
                  onChange={(e) => setConfig({ ...config, nombreNegocio: e.target.value })}
                  className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Mi Lavandería"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                <input
                  type="text"
                  value={config.ruc || ''}
                  onChange={(e) => setConfig({ ...config, ruc: e.target.value })}
                  className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="12345678901"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={config.direccion}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Av. Principal 123"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="999 999 999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full px-3 py-3 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="contacto@lavanderia.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Facturación */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Facturación</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Símbolo de Moneda
                </label>
                <select
                  value={config.moneda}
                  onChange={(e) => setConfig({ ...config, moneda: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="S/">S/ - Soles Peruanos</option>
                  <option value="$">$ - Dólares</option>
                  <option value="€">€ - Euros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje en Factura
                </label>
                <textarea
                  value={config.mensajeFactura || ''}
                  onChange={(e) => setConfig({ ...config, mensajeFactura: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="¡Gracias por su preferencia!"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este mensaje aparecerá al final de cada factura impresa
                </p>
              </div>
            </div>
          </div>

          {/* Vista Previa de Factura */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa de Factura</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="max-w-[200px] mx-auto font-mono text-xs text-center">
                <p className="font-bold text-sm">{config.nombreNegocio || 'Nombre del Negocio'}</p>
                {config.ruc && <p>RUC: {config.ruc}</p>}
                <p>{config.direccion || 'Dirección'}</p>
                <p>Tel: {config.telefono || 'Teléfono'}</p>
                <hr className="my-2 border-dashed" />
                <p className="text-gray-400">--- Contenido de la factura ---</p>
                <hr className="my-2 border-dashed" />
                <p className="font-bold">{config.mensajeFactura || 'Mensaje de agradecimiento'}</p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 md:py-2 text-gray-600 hover:text-gray-800"
            >
              <FiRefreshCw className="mr-2" />
              Restablecer
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiSave className="mr-2" />
              Guardar
            </button>
          </div>

          {saved && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
              ✓ Configuración guardada correctamente
            </div>
          )}
        </form>

        {/* Estado de Conexión Supabase */}
        <div className={`rounded-xl p-4 ${connectionStatus === 'connected' ? 'bg-green-50' : connectionStatus === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connectionStatus === 'connected' ? (
                <FiWifi className="w-5 h-5 text-green-600" />
              ) : connectionStatus === 'error' ? (
                <FiWifiOff className="w-5 h-5 text-red-600" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
              <div>
                <p className={`font-semibold ${connectionStatus === 'connected' ? 'text-green-800' : connectionStatus === 'error' ? 'text-red-800' : 'text-gray-800'}`}>
                  {connectionStatus === 'connected' ? 'Conectado a Supabase' : connectionStatus === 'error' ? 'Sin conexión a Supabase' : 'Probando conexión...'}
                </p>
                {connectionStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{connectionError}</p>
                )}
                {connectionStatus === 'error' && (
                  <p className="text-xs text-gray-600 mt-1">Usando almacenamiento local como respaldo</p>
                )}
              </div>
            </div>
            <button
              onClick={checkConnection}
              className="px-3 py-1 text-sm bg-white rounded-lg border hover:bg-gray-50"
            >
              Reintentar
            </button>
          </div>
        </div>

        {/* Información de Supabase */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Configuración de Supabase</h3>
          <p className="text-xs text-blue-700 mb-3">
            Para conectar con Supabase, crea las tablas y configura las variables de entorno.
          </p>
          <div className="bg-white rounded-lg p-3 font-mono text-xs overflow-x-auto space-y-1">
            <p><span className="text-gray-500">URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configurado' : '✗ No configurado'}</p>
            <p><span className="text-gray-500">Key:</span> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurado' : '✗ No configurado'}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
