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
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
  { href: '/pedidos', label: 'Pedidos', icon: <FiShoppingBag className="w-5 h-5" /> },
  { href: '/nuevo-pedido', label: 'Nuevo Pedido', icon: <FiPlusCircle className="w-5 h-5" /> },
  { href: '/servicios', label: 'Servicios', icon: <FiSettings className="w-5 h-5" /> },
  { href: '/finanzas', label: 'Finanzas', icon: <FiDollarSign className="w-5 h-5" /> },
  { href: '/reportes', label: 'Reportes', icon: <FiPieChart className="w-5 h-5" /> },
  { href: '/facturas', label: 'Facturas', icon: <FiFileText className="w-5 h-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState('Lavandería');

  useEffect(() => {
    const config = getConfiguracionSync();
    setNombreNegocio(config.nombreNegocio);
  }, []);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-40 flex items-center px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
        <h1 className="ml-2 font-bold text-gray-800 truncate">{nombreNegocio}</h1>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 lg:p-6 border-b">
          <h1 className="text-lg lg:text-xl font-bold text-gray-800 truncate">{nombreNegocio}</h1>
          <p className="text-xs lg:text-sm text-gray-500">Panel de Control</p>
        </div>

        <nav className="p-3 lg:p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-colors active:bg-blue-100 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t bg-white">
          <Link
            href="/configuracion"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-colors active:bg-blue-100 ${
              pathname === '/configuracion'
                ? 'bg-blue-50 text-blue-600'
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
