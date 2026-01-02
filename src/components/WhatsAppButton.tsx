'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { abrirWhatsApp } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  telefono: string;
  mensaje: string;
  className?: string;
  variant?: 'button' | 'icon' | 'fab';
  label?: string;
}

export default function WhatsAppButton({
  telefono,
  mensaje,
  className = '',
  variant = 'button',
  label = 'WhatsApp'
}: WhatsAppButtonProps) {
  const handleClick = () => {
    if (!telefono) {
      alert('No hay número de teléfono registrado');
      return;
    }
    abrirWhatsApp(telefono, mensaje);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors active:scale-95 ${className}`}
        title="Enviar WhatsApp"
      >
        <FaWhatsapp className="w-5 h-5" />
      </button>
    );
  }

  if (variant === 'fab') {
    return (
      <button
        onClick={handleClick}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-95 ${className}`}
        title="Enviar WhatsApp"
      >
        <FaWhatsapp className="w-7 h-7" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`btn-whatsapp ${className}`}
    >
      <FaWhatsapp className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

