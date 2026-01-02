'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FiHome, 
  FiSettings, 
  FiDollarSign, 
  FiMenu, 
  FiX,
  FiShoppingBag,
  FiPlusCircle,
} from 'react-icons/fi';
import { getConfiguracionSync } from '@/lib/store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

// Solo las opciones esenciales para el dueño
const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', icon: <FiHome className="w-5 h-5" /> },
  { href: '/nuevo-pedido', label: '+ Nuevo Pedido', icon: <FiPlusCircle className="w-5 h-5" />, highlight: true },
  { href: '/pedidos', label: 'Mis Pedidos', icon: <FiShoppingBag className="w-5 h-5" /> },
  { href: '/finanzas', label: 'Dinero', icon: <FiDollarSign className="w-5 h-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState('Mi Lavandería');

  useEffect(() => {
    const config = getConfiguracionSync();
    setNombreNegocio(config.nombreNegocio);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Barra superior móvil - Simple */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-slate-800">{nombreNegocio}</span>
        </div>
        
        {/* Botón grande de nuevo pedido */}
        <Link
          href="/nuevo-pedido"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20"
        >
          <FiPlusCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo</span>
        </Link>
      </div>

      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menú lateral */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-40 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:w-60`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              🧺
            </div>
            <div>
              <h1 className="font-bold text-slate-900">{nombreNegocio}</h1>
              <p className="text-xs text-slate-500">Panel Simple</p>
            </div>
          </div>
        </div>

        {/* Navegación principal - SIMPLE */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                  item.highlight && !isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span className="font-medium text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Configuración al final */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100">
          <Link
            href="/configuracion"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/configuracion'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FiSettings className="w-5 h-5" />
            <span className="font-medium">Ajustes</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
