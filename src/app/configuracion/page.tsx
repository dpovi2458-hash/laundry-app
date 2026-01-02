'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiSave, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { getConfiguracion, updateConfiguracion } from '@/lib/store';
import { Configuracion } from '@/types';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      const configData = await getConfiguracion();
      setConfig(configData);
      setIsLoading(false);
    }
    loadConfig();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateConfiguracion(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">⚙️ Ajustes</h1>
            <p className="text-sm text-slate-500">Configura tu negocio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos principales */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
            <h2 className="font-bold text-slate-800">📋 Tu Negocio</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Nombre de tu lavandería
              </label>
              <input
                type="text"
                value={config.nombreNegocio}
                onChange={(e) => setConfig({ ...config, nombreNegocio: e.target.value })}
                placeholder="Mi Lavandería Express"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                placeholder="Av. Principal 123, Lima"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={config.telefono}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  placeholder="999 999 999"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  RUC (opcional)
                </label>
                <input
                  type="text"
                  value={config.ruc || ''}
                  onChange={(e) => setConfig({ ...config, ruc: e.target.value })}
                  placeholder="12345678901"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Moneda */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
            <h2 className="font-bold text-slate-800">💰 Moneda</h2>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'S/', label: 'Soles' },
                { value: '$', label: 'Dólares' },
                { value: '€', label: 'Euros' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setConfig({ ...config, moneda: m.value })}
                  className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                    config.moneda === m.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {m.value} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje factura */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
            <h2 className="font-bold text-slate-800">🧾 Mensaje en Ticket</h2>
            
            <textarea
              value={config.mensajeFactura || ''}
              onChange={(e) => setConfig({ ...config, mensajeFactura: e.target.value })}
              placeholder="¡Gracias por su preferencia!"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              rows={2}
            />
            <p className="text-xs text-slate-500">
              Este mensaje aparece al final de cada ticket impreso
            </p>
          </div>

          {/* Acceso a servicios */}
          <Link
            href="/servicios"
            className="flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧺</span>
              <div>
                <p className="font-bold text-slate-800">Mis Servicios</p>
                <p className="text-sm text-slate-500">Agregar o editar servicios</p>
              </div>
            </div>
            <FiArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </Link>

          {/* Botón guardar fijo */}
          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 text-white active:scale-[0.98]'
            }`}
          >
            {saved ? (
              <>
                <FiCheck className="w-5 h-5" />
                ¡Guardado!
              </>
            ) : (
              <>
                <FiSave className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
