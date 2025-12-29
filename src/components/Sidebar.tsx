'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FiHome, 
  FiSettings, 
  FiDollarSign, 
  FiFileText, 
  FiPieChart, 
  FiMenu, 
  FiX,
  FiShoppingBag,
  FiPlusCircle
} from 'react-icons/fi';
import { getConfiguracionSync } from '@/lib/store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
  { href: '/nuevo-pedido', label: 'Nuevo Pedido', icon: <FiPlusCircle className="w-5 h-5" />, highlight: true },
  { href: '/pedidos', label: 'Pedidos', icon: <FiShoppingBag className="w-5 h-5" /> },
  { href: '/finanzas', label: 'Finanzas', icon: <FiDollarSign className="w-5 h-5" /> },
  { href: '/reportes', label: 'Reportes', icon: <FiPieChart className="w-5 h-5" /> },
  { href: '/facturas', label: 'Facturas', icon: <FiFileText className="w-5 h-5" /> },
  { href: '/servicios', label: 'Servicios', icon: <FiSettings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState('Lavandería');

  useEffect(() => {
    const config = getConfiguracionSync();
    setNombreNegocio(config.nombreNegocio);
  }, []);

  // Cerrar el menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-40 flex items-center justify-between px-4 safe-area-top">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <h1 className="ml-2 font-bold text-gray-800 truncate">{nombreNegocio}</h1>
        </div>
        {/* Botón rápido de nuevo pedido en móvil */}
        <Link
          href="/nuevo-pedido"
          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          <FiPlusCircle className="w-5 h-5" />
        </Link>
      </div>

      {/* Overlay con animación */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:w-64`}
      >
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <h1 className="text-lg lg:text-xl font-bold text-white truncate">{nombreNegocio}</h1>
          <p className="text-xs lg:text-sm text-blue-100">Panel de Control</p>
        </div>

        <nav className="p-3 lg:p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
                  item.highlight && !isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl'
                    : isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t bg-white safe-area-bottom">
          <Link
            href="/configuracion"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
              pathname === '/configuracion'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiSettings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
