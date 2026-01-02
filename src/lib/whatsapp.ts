// Utilidades para integración con WhatsApp

import { Pedido, Configuracion } from '@/types';

// Genera el link de WhatsApp con mensaje predefinido
export function generarLinkWhatsApp(
  telefono: string,
  mensaje: string
): string {
  // Limpiar número de teléfono (solo dígitos)
  const numeroLimpio = telefono.replace(/\D/g, '');
  
  // Agregar código de país si no lo tiene (Perú = 51)
  const numeroConCodigo = numeroLimpio.length === 9 
    ? `51${numeroLimpio}` 
    : numeroLimpio;
  
  // Codificar mensaje para URL
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  return `https://wa.me/${numeroConCodigo}?text=${mensajeCodificado}`;
}

// Templates de mensajes
export function getMensajePedidoRecibido(
  pedido: Pedido,
  config: Configuracion
): string {
  const template = config.whatsappMsgPendiente || 
    `¡Hola {cliente}! 👋\n\n` +
    `Tu pedido ha sido recibido en *{negocio}*.\n\n` +
    `📋 *Ticket:* {ticket}\n` +
    `💰 *Total:* {moneda}{total}\n` +
    `📅 *Entrega:* {fechaEntrega}\n\n` +
    `Te avisaremos cuando esté listo. ¡Gracias por confiar en nosotros! 🧺✨`;

  return reemplazarVariables(template, pedido, config);
}

export function getMensajePedidoListo(
  pedido: Pedido,
  config: Configuracion
): string {
  const template = config.whatsappMsgListo || 
    `¡Hola {cliente}! 🎉\n\n` +
    `Tu pedido *{ticket}* está *LISTO* para recoger.\n\n` +
    `📍 *Dirección:* {direccion}\n` +
    `💰 *Total:* {moneda}{total}\n\n` +
    `¡Te esperamos! 🧺✨`;

  return reemplazarVariables(template, pedido, config);
}

export function getMensajeAgradecimiento(
  pedido: Pedido,
  config: Configuracion,
  puntos?: number
): string {
  const template = config.whatsappMsgEntregado || 
    `¡Hola {cliente}! 🙏\n\n` +
    `¡Gracias por tu visita a *{negocio}*!\n\n` +
    `${puntos ? `🎁 Has acumulado *${puntos} puntos* de fidelidad.\n\n` : ''}` +
    `¡Esperamos verte pronto! 🧺💙`;

  return reemplazarVariables(template, pedido, config);
}

function reemplazarVariables(
  template: string,
  pedido: Pedido,
  config: Configuracion
): string {
  return template
    .replace(/{cliente}/g, pedido.cliente)
    .replace(/{negocio}/g, config.nombreNegocio)
    .replace(/{ticket}/g, pedido.numeroFactura)
    .replace(/{total}/g, pedido.total.toFixed(2))
    .replace(/{moneda}/g, config.moneda)
    .replace(/{direccion}/g, config.direccion)
    .replace(/{fechaEntrega}/g, pedido.fechaEntrega || 'Por confirmar')
    .replace(/{telefono}/g, config.telefono);
}

// Componente para abrir WhatsApp
export function abrirWhatsApp(telefono: string, mensaje: string): void {
  const link = generarLinkWhatsApp(telefono, mensaje);
  window.open(link, '_blank');
}

