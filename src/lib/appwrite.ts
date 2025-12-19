import { Client, Databases, ID, Query } from 'appwrite';
import { Servicio, Pedido, Ingreso, Egreso, Configuracion } from '@/types';

// Configuración de Appwrite
const client = new Client();

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

console.log('[Appwrite] Inicializando con:', { ENDPOINT, PROJECT_ID: PROJECT_ID ? PROJECT_ID.substring(0, 8) + '...' : 'NO CONFIGURADO' });

client
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

export const databases = new Databases(client);

// IDs de la base de datos y colecciones
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'lavanderia_db';
export const COLLECTIONS = {
  SERVICIOS: process.env.NEXT_PUBLIC_COLLECTION_SERVICIOS || 'servicios',
  PEDIDOS: process.env.NEXT_PUBLIC_COLLECTION_PEDIDOS || 'pedidos',
  INGRESOS: process.env.NEXT_PUBLIC_COLLECTION_INGRESOS || 'ingresos',
  EGRESOS: process.env.NEXT_PUBLIC_COLLECTION_EGRESOS || 'egresos',
  CONFIGURACION: process.env.NEXT_PUBLIC_COLLECTION_CONFIG || 'configuracion',
};

console.log('[Appwrite] Database:', DATABASE_ID, 'Collections:', COLLECTIONS);

// Test de conexión
export async function testConnection(): Promise<{ success: boolean; error?: string; details?: unknown }> {
  try {
    console.log('[Appwrite] Probando conexión...');
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SERVICIOS, [Query.limit(1)]);
    console.log('[Appwrite] Conexión exitosa, documentos:', response.total);
    return { success: true, details: { total: response.total } };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number; type?: string };
    console.error('[Appwrite] Error de conexión:', err);
    return { 
      success: false, 
      error: err.message || 'Error desconocido',
      details: { code: err.code, type: err.type }
    };
  }
}

// ==================== SERVICIOS ====================
export async function getServicios(): Promise<Servicio[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SERVICIOS,
      [Query.orderDesc('$createdAt')]
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      precio: doc.precio,
      unidad: doc.unidad,
      activo: doc.activo,
      createdAt: doc.$createdAt,
    })) as Servicio[];
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
}

export async function createServicio(servicio: Omit<Servicio, '$id'>): Promise<Servicio | null> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SERVICIOS,
      ID.unique(),
      {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        unidad: servicio.unidad,
        activo: servicio.activo ?? true,
      }
    );
    return { ...servicio, $id: response.$id, createdAt: response.$createdAt };
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return null;
  }
}

export async function updateServicio(id: string, servicio: Partial<Servicio>): Promise<boolean> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SERVICIOS,
      id,
      {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        unidad: servicio.unidad,
        activo: servicio.activo,
      }
    );
    return true;
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return false;
  }
}

export async function deleteServicio(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SERVICIOS, id);
    return true;
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return false;
  }
}

// ==================== PEDIDOS ====================
export async function getPedidos(): Promise<Pedido[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PEDIDOS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      numeroFactura: doc.numeroFactura,
      cliente: doc.cliente,
      telefono: doc.telefono,
      servicios: JSON.parse(doc.servicios || '[]'),
      subtotal: doc.subtotal,
      descuento: doc.descuento,
      total: doc.total,
      estado: doc.estado,
      metodoPago: doc.metodoPago,
      notas: doc.notas,
      fechaRecepcion: doc.fechaRecepcion,
      fechaEntrega: doc.fechaEntrega,
      createdAt: doc.$createdAt,
    })) as Pedido[];
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return [];
  }
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PEDIDOS, id);
    return {
      $id: doc.$id,
      numeroFactura: doc.numeroFactura,
      cliente: doc.cliente,
      telefono: doc.telefono,
      servicios: JSON.parse(doc.servicios || '[]'),
      subtotal: doc.subtotal,
      descuento: doc.descuento,
      total: doc.total,
      estado: doc.estado,
      metodoPago: doc.metodoPago,
      notas: doc.notas,
      fechaRecepcion: doc.fechaRecepcion,
      fechaEntrega: doc.fechaEntrega,
      createdAt: doc.$createdAt,
    } as Pedido;
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return null;
  }
}

export async function createPedido(pedido: Omit<Pedido, '$id'>): Promise<Pedido | null> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PEDIDOS,
      ID.unique(),
      {
        numeroFactura: pedido.numeroFactura,
        cliente: pedido.cliente,
        telefono: pedido.telefono || '',
        servicios: JSON.stringify(pedido.servicios),
        subtotal: pedido.subtotal,
        descuento: pedido.descuento,
        total: pedido.total,
        estado: pedido.estado,
        metodoPago: pedido.metodoPago,
        notas: pedido.notas || '',
        fechaRecepcion: pedido.fechaRecepcion,
        fechaEntrega: pedido.fechaEntrega || '',
      }
    );
    return { ...pedido, $id: response.$id, createdAt: response.$createdAt };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return null;
  }
}

export async function updatePedido(id: string, pedido: Partial<Pedido>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};
    if (pedido.estado) updateData.estado = pedido.estado;
    if (pedido.fechaEntrega) updateData.fechaEntrega = pedido.fechaEntrega;
    if (pedido.notas !== undefined) updateData.notas = pedido.notas;
    if (pedido.servicios) updateData.servicios = JSON.stringify(pedido.servicios);
    if (pedido.total !== undefined) updateData.total = pedido.total;
    if (pedido.subtotal !== undefined) updateData.subtotal = pedido.subtotal;
    if (pedido.descuento !== undefined) updateData.descuento = pedido.descuento;
    
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PEDIDOS, id, updateData);
    return true;
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return false;
  }
}

export async function deletePedido(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PEDIDOS, id);
    return true;
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return false;
  }
}

// ==================== INGRESOS ====================
export async function getIngresos(): Promise<Ingreso[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INGRESOS,
      [Query.orderDesc('fecha'), Query.limit(100)]
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      concepto: doc.concepto,
      monto: doc.monto,
      categoria: doc.categoria,
      pedidoId: doc.pedidoId,
      fecha: doc.fecha,
      notas: doc.notas,
      createdAt: doc.$createdAt,
    })) as Ingreso[];
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    return [];
  }
}

export async function createIngreso(ingreso: Omit<Ingreso, '$id'>): Promise<Ingreso | null> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.INGRESOS,
      ID.unique(),
      {
        concepto: ingreso.concepto,
        monto: ingreso.monto,
        categoria: ingreso.categoria,
        pedidoId: ingreso.pedidoId || '',
        fecha: ingreso.fecha,
        notas: ingreso.notas || '',
      }
    );
    return { ...ingreso, $id: response.$id, createdAt: response.$createdAt };
  } catch (error) {
    console.error('Error al crear ingreso:', error);
    return null;
  }
}

export async function deleteIngreso(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.INGRESOS, id);
    return true;
  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    return false;
  }
}

// ==================== EGRESOS ====================
export async function getEgresos(): Promise<Egreso[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EGRESOS,
      [Query.orderDesc('fecha'), Query.limit(100)]
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      concepto: doc.concepto,
      monto: doc.monto,
      categoria: doc.categoria,
      fecha: doc.fecha,
      notas: doc.notas,
      createdAt: doc.$createdAt,
    })) as Egreso[];
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    return [];
  }
}

export async function createEgreso(egreso: Omit<Egreso, '$id'>): Promise<Egreso | null> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EGRESOS,
      ID.unique(),
      {
        concepto: egreso.concepto,
        monto: egreso.monto,
        categoria: egreso.categoria,
        fecha: egreso.fecha,
        notas: egreso.notas || '',
      }
    );
    return { ...egreso, $id: response.$id, createdAt: response.$createdAt };
  } catch (error) {
    console.error('Error al crear egreso:', error);
    return null;
  }
}

export async function deleteEgreso(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EGRESOS, id);
    return true;
  } catch (error) {
    console.error('Error al eliminar egreso:', error);
    return false;
  }
}

// ==================== CONFIGURACIÓN ====================
export async function getConfiguracion(): Promise<Configuracion | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONFIGURACION,
      [Query.limit(1)]
    );
    if (response.documents.length === 0) return null;
    const doc = response.documents[0];
    return {
      $id: doc.$id,
      nombreNegocio: doc.nombreNegocio,
      ruc: doc.ruc,
      direccion: doc.direccion,
      telefono: doc.telefono,
      email: doc.email,
      moneda: doc.moneda,
      mensajeFactura: doc.mensajeFactura,
    } as Configuracion;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return null;
  }
}

export async function saveConfiguracion(config: Configuracion): Promise<boolean> {
  try {
    const existing = await getConfiguracion();
    if (existing && existing.$id) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CONFIGURACION,
        existing.$id,
        {
          nombreNegocio: config.nombreNegocio,
          ruc: config.ruc || '',
          direccion: config.direccion,
          telefono: config.telefono,
          email: config.email || '',
          moneda: config.moneda,
          mensajeFactura: config.mensajeFactura || '',
        }
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONFIGURACION,
        ID.unique(),
        {
          nombreNegocio: config.nombreNegocio,
          ruc: config.ruc || '',
          direccion: config.direccion,
          telefono: config.telefono,
          email: config.email || '',
          moneda: config.moneda,
          mensajeFactura: config.mensajeFactura || '',
        }
      );
    }
    return true;
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return false;
  }
}

// ==================== UTILIDADES ====================
export async function generarNumeroFactura(): Promise<string> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PEDIDOS,
      [Query.orderDesc('$createdAt'), Query.limit(1)]
    );
    
    const hoy = new Date();
    const año = hoy.getFullYear().toString().slice(-2);
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    
    let numero = 1;
    if (response.documents.length > 0) {
      const ultimaFactura = response.documents[0].numeroFactura;
      const match = ultimaFactura.match(/(\d+)$/);
      if (match) {
        numero = parseInt(match[1]) + 1;
      }
    }
    
    return `FAC-${año}${mes}-${numero.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error al generar número de factura:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `FAC-${timestamp}`;
  }
}

export { ID, Query };
export default client;
