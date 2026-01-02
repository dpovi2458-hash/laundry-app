// Tipos para el sistema de lavandería

export interface Servicio {
  $id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  unidad: 'kg' | 'prenda' | 'unidad';
  activo: boolean;
  createdAt?: string;
}

export interface Pedido {
  $id?: string;
  numeroFactura: string;
  cliente: string;
  clienteId?: string; // Referencia a cliente recurrente
  telefono?: string;
  servicios: ServicioPedido[];
  subtotal: number;
  descuento: number;
  total: number;
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  metodoPago: 'efectivo' | 'yape' | 'plin' | 'transferencia';
  notas?: string;
  fechaRecepcion: string;
  fechaEntrega?: string;
  horaEntrega?: string;
  notificado?: boolean; // Si ya se envió WhatsApp
  puntosFidelidad?: number;
  createdAt?: string;
}

export interface ServicioPedido {
  servicioId: string;
  servicioNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// NUEVO: Cliente recurrente
export interface Cliente {
  $id?: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  puntosFidelidad: number;
  totalPedidos: number;
  totalGastado: number;
  ultimoPedido?: string;
  createdAt?: string;
}

export interface Ingreso {
  $id?: string;
  concepto: string;
  monto: number;
  categoria: 'pedido' | 'otro';
  pedidoId?: string;
  fecha: string;
  notas?: string;
  createdAt?: string;
}

export interface Egreso {
  $id?: string;
  concepto: string;
  monto: number;
  categoria: 'suministros' | 'servicios' | 'mantenimiento' | 'otros';
  fecha: string;
  notas?: string;
  createdAt?: string;
}

export interface Configuracion {
  $id?: string;
  nombreNegocio: string;
  ruc?: string;
  direccion: string;
  telefono: string;
  whatsapp?: string; // NUEVO: WhatsApp del negocio
  email?: string;
  moneda: string;
  mensajeFactura?: string;
  // Configuración de fidelización
  puntosEnabled?: boolean;
  puntosPorSol?: number; // Puntos por cada sol gastado
  solPorPunto?: number; // Valor de cada punto en soles
  // WhatsApp templates
  whatsappMsgPendiente?: string;
  whatsappMsgListo?: string;
  whatsappMsgEntregado?: string;
}

export interface ResumenFinanciero {
  ingresos: number;
  egresos: number;
  balance: number;
  pedidosTotal: number;
  pedidosPendientes: number;
}

export interface ReportePeriodo {
  periodo: string;
  ingresos: number;
  egresos: number;
  balance: number;
  cantidadPedidos: number;
}

export interface FacturaImpresa {
  $id?: string;
  pedidoId: string;
  numeroFactura: string;
  cliente: string;
  total: number;
  contenidoHtml?: string;
  impresoEn?: string;
  createdAt?: string;
}

export interface DatosGrafica {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

// NUEVO: Estadísticas de cliente
export interface ClienteStats {
  servicioFavorito: string;
  frecuenciaVisita: string; // "semanal", "quincenal", "mensual"
  diasDesdeUltimoVisita: number;
  promedioTicket: number;
}
