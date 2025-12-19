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
  createdAt?: string;
}

export interface ServicioPedido {
  servicioId: string;
  servicioNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
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
  email?: string;
  moneda: string;
  mensajeFactura?: string;
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
