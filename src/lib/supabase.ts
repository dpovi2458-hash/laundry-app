import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Servicio, Pedido, Ingreso, Egreso, Configuracion } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

console.log('[Supabase] Estado:', isConfigured ? 'Configurado' : 'No configurado');

// Crear cliente solo si está configurado
let supabase: SupabaseClient | null = null;
if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Test de conexión
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase no configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY' };
  }
  try {
    const { data, error } = await supabase.from('servicios').select('id').limit(1);
    if (error) throw error;
    console.log('[Supabase] Conexión exitosa');
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Supabase] Error de conexión:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

// ==================== SERVICIOS ====================
export async function getServicios(): Promise<Servicio[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(doc => ({
      $id: doc.id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      precio: doc.precio,
      unidad: doc.unidad,
      activo: doc.activo,
      createdAt: doc.created_at,
    }));
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
}

export async function createServicio(servicio: Omit<Servicio, '$id'>): Promise<Servicio | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('servicios')
      .insert({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        unidad: servicio.unidad,
        activo: servicio.activo ?? true,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      $id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      unidad: data.unidad,
      activo: data.activo,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return null;
  }
}

export async function updateServicio(id: string, servicio: Partial<Servicio>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('servicios')
      .update({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        unidad: servicio.unidad,
        activo: servicio.activo,
      })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return false;
  }
}

export async function deleteServicio(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('servicios').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return false;
  }
}

// ==================== PEDIDOS ====================
export async function getPedidos(): Promise<Pedido[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    return (data || []).map(doc => ({
      $id: doc.id,
      numeroFactura: doc.numero_factura,
      cliente: doc.cliente,
      telefono: doc.telefono,
      servicios: doc.servicios || [],
      subtotal: doc.subtotal,
      descuento: doc.descuento,
      total: doc.total,
      estado: doc.estado,
      metodoPago: doc.metodo_pago,
      notas: doc.notas,
      fechaRecepcion: doc.fecha_recepcion,
      fechaEntrega: doc.fecha_entrega,
      createdAt: doc.created_at,
    }));
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return [];
  }
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      $id: data.id,
      numeroFactura: data.numero_factura,
      cliente: data.cliente,
      telefono: data.telefono,
      servicios: data.servicios || [],
      subtotal: data.subtotal,
      descuento: data.descuento,
      total: data.total,
      estado: data.estado,
      metodoPago: data.metodo_pago,
      notas: data.notas,
      fechaRecepcion: data.fecha_recepcion,
      fechaEntrega: data.fecha_entrega,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return null;
  }
}

export async function createPedido(pedido: Omit<Pedido, '$id'>): Promise<Pedido | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        numero_factura: pedido.numeroFactura,
        cliente: pedido.cliente,
        telefono: pedido.telefono || '',
        servicios: pedido.servicios,
        subtotal: pedido.subtotal,
        descuento: pedido.descuento,
        total: pedido.total,
        estado: pedido.estado,
        metodo_pago: pedido.metodoPago,
        notas: pedido.notas || '',
        fecha_recepcion: pedido.fechaRecepcion,
        fecha_entrega: pedido.fechaEntrega || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      $id: data.id,
      numeroFactura: data.numero_factura,
      cliente: data.cliente,
      telefono: data.telefono,
      servicios: data.servicios,
      subtotal: data.subtotal,
      descuento: data.descuento,
      total: data.total,
      estado: data.estado,
      metodoPago: data.metodo_pago,
      notas: data.notas,
      fechaRecepcion: data.fecha_recepcion,
      fechaEntrega: data.fecha_entrega,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return null;
  }
}

export async function updatePedido(id: string, pedido: Partial<Pedido>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const updateData: Record<string, unknown> = {};
    if (pedido.estado) updateData.estado = pedido.estado;
    if (pedido.fechaEntrega) updateData.fecha_entrega = pedido.fechaEntrega;
    if (pedido.notas !== undefined) updateData.notas = pedido.notas;
    if (pedido.servicios) updateData.servicios = pedido.servicios;
    if (pedido.total !== undefined) updateData.total = pedido.total;
    if (pedido.subtotal !== undefined) updateData.subtotal = pedido.subtotal;
    if (pedido.descuento !== undefined) updateData.descuento = pedido.descuento;
    
    const { error } = await supabase.from('pedidos').update(updateData).eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return false;
  }
}

export async function deletePedido(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return false;
  }
}

// ==================== INGRESOS ====================
export async function getIngresos(): Promise<Ingreso[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ingresos')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    return (data || []).map(doc => ({
      $id: doc.id,
      concepto: doc.concepto,
      monto: doc.monto,
      categoria: doc.categoria,
      pedidoId: doc.pedido_id,
      fecha: doc.fecha,
      notas: doc.notas,
      createdAt: doc.created_at,
    }));
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    return [];
  }
}

export async function createIngreso(ingreso: Omit<Ingreso, '$id'>): Promise<Ingreso | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('ingresos')
      .insert({
        concepto: ingreso.concepto,
        monto: ingreso.monto,
        categoria: ingreso.categoria,
        pedido_id: ingreso.pedidoId || null,
        fecha: ingreso.fecha,
        notas: ingreso.notas || '',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      $id: data.id,
      concepto: data.concepto,
      monto: data.monto,
      categoria: data.categoria,
      pedidoId: data.pedido_id,
      fecha: data.fecha,
      notas: data.notas,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error al crear ingreso:', error);
    return null;
  }
}

export async function deleteIngreso(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    return false;
  }
}

// ==================== EGRESOS ====================
export async function getEgresos(): Promise<Egreso[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('egresos')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    return (data || []).map(doc => ({
      $id: doc.id,
      concepto: doc.concepto,
      monto: doc.monto,
      categoria: doc.categoria,
      fecha: doc.fecha,
      notas: doc.notas,
      createdAt: doc.created_at,
    }));
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    return [];
  }
}

export async function createEgreso(egreso: Omit<Egreso, '$id'>): Promise<Egreso | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('egresos')
      .insert({
        concepto: egreso.concepto,
        monto: egreso.monto,
        categoria: egreso.categoria,
        fecha: egreso.fecha,
        notas: egreso.notas || '',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      $id: data.id,
      concepto: data.concepto,
      monto: data.monto,
      categoria: data.categoria,
      fecha: data.fecha,
      notas: data.notas,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error al crear egreso:', error);
    return null;
  }
}

export async function deleteEgreso(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('egresos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar egreso:', error);
    return false;
  }
}

// ==================== CONFIGURACIÓN ====================
export async function getConfiguracion(): Promise<Configuracion | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    
    return {
      $id: data.id,
      nombreNegocio: data.nombre_negocio,
      ruc: data.ruc,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      moneda: data.moneda,
      mensajeFactura: data.mensaje_factura,
    };
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return null;
  }
}

export async function saveConfiguracion(config: Configuracion): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('configuracion')
      .select('id')
      .limit(1)
      .single();
    
    if (existing) {
      // Actualizar
      const { error } = await supabase
        .from('configuracion')
        .update({
          nombre_negocio: config.nombreNegocio,
          ruc: config.ruc || '',
          direccion: config.direccion,
          telefono: config.telefono,
          email: config.email || '',
          moneda: config.moneda,
          mensaje_factura: config.mensajeFactura || '',
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from('configuracion')
        .insert({
          nombre_negocio: config.nombreNegocio,
          ruc: config.ruc || '',
          direccion: config.direccion,
          telefono: config.telefono,
          email: config.email || '',
          moneda: config.moneda,
          mensaje_factura: config.mensajeFactura || '',
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return false;
  }
}

// ==================== UTILIDADES ====================
export async function generarNumeroFactura(): Promise<string> {
  if (!supabase) {
    const timestamp = Date.now().toString().slice(-6);
    return `FAC-${timestamp}`;
  }
  try {
    const { data } = await supabase
      .from('pedidos')
      .select('numero_factura')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const hoy = new Date();
    const año = hoy.getFullYear().toString().slice(-2);
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    
    let numero = 1;
    if (data?.numero_factura) {
      const match = data.numero_factura.match(/(\d+)$/);
      if (match) {
        numero = parseInt(match[1]) + 1;
      }
    }
    
    return `FAC-${año}${mes}-${numero.toString().padStart(4, '0')}`;
  } catch (error) {
    const timestamp = Date.now().toString().slice(-6);
    return `FAC-${timestamp}`;
  }
}

export default supabase;
