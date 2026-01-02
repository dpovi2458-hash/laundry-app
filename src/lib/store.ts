// Store híbrido: Supabase cloud + localStorage como fallback

import { Servicio, Pedido, Ingreso, Egreso, Configuracion, FacturaImpresa, Cliente } from '@/types';
import * as supabaseLib from './supabase';

// ============== CONFIGURACIÓN ==============
const USE_SUPABASE = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;

const STORAGE_KEYS = {
  SERVICIOS: 'lavanderia_servicios',
  PEDIDOS: 'lavanderia_pedidos',
  INGRESOS: 'lavanderia_ingresos',
  EGRESOS: 'lavanderia_egresos',
  CONFIG: 'lavanderia_config',
  CONTADOR_FACTURA: 'lavanderia_contador_factura',
  FACTURAS_IMPRESAS: 'lavanderia_facturas_impresas',
  CLIENTES: 'lavanderia_clientes',
};

// Datos iniciales de servicios
const serviciosIniciales: Servicio[] = [
  { $id: '1', nombre: 'Lavado por Kilo', descripcion: 'Lavado completo de ropa por kilogramo', precio: 8.00, unidad: 'kg', activo: true },
  { $id: '2', nombre: 'Lavado de Edredón', descripcion: 'Lavado de edredón o cobertor', precio: 25.00, unidad: 'unidad', activo: true },
  { $id: '3', nombre: 'Lavado de Frazada', descripcion: 'Lavado de frazada', precio: 18.00, unidad: 'unidad', activo: true },
  { $id: '4', nombre: 'Planchado', descripcion: 'Servicio de planchado por prenda', precio: 3.00, unidad: 'prenda', activo: true },
  { $id: '5', nombre: 'Lavado en Seco', descripcion: 'Lavado en seco para prendas delicadas', precio: 15.00, unidad: 'prenda', activo: true },
  { $id: '6', nombre: 'Lavado de Zapatillas', descripcion: 'Limpieza de zapatillas', precio: 12.00, unidad: 'unidad', activo: true },
];

const configInicial: Configuracion = {
  $id: '1',
  nombreNegocio: 'Lavandería Express',
  ruc: '',
  direccion: 'Mz O Lt 23, Chillón - Pte. Piedra (Frt. Merc. Modelo)',
  telefono: '999 999 999',
  email: '',
  moneda: 'S/',
  mensajeFactura: '¡Gracias por su preferencia!',
};

// ============== HELPERS LOCALSTORAGE ==============
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============== SERVICIOS ==============
export async function getServicios(): Promise<Servicio[]> {
  if (USE_SUPABASE) {
    try {
      const servicios = await supabaseLib.getServicios();
      if (servicios.length > 0) return servicios;
      // Si no hay servicios en Appwrite, crear los iniciales
      for (const servicio of serviciosIniciales) {
        await supabaseLib.createServicio(servicio);
      }
      return await supabaseLib.getServicios();
    } catch (error) {
      console.log('Usando localStorage para servicios:', error);
    }
  }
  // Fallback a localStorage
  const servicios = getFromStorage<Servicio[]>(STORAGE_KEYS.SERVICIOS, []);
  if (servicios.length === 0) {
    saveToStorage(STORAGE_KEYS.SERVICIOS, serviciosIniciales);
    return serviciosIniciales;
  }
  return servicios;
}

export function getServiciosSync(): Servicio[] {
  const servicios = getFromStorage<Servicio[]>(STORAGE_KEYS.SERVICIOS, []);
  if (servicios.length === 0) {
    saveToStorage(STORAGE_KEYS.SERVICIOS, serviciosIniciales);
    return serviciosIniciales;
  }
  return servicios;
}

export async function getServicioById(id: string): Promise<Servicio | undefined> {
  const servicios = await getServicios();
  return servicios.find(s => s.$id === id);
}

export async function createServicio(servicio: Omit<Servicio, '$id'>): Promise<Servicio> {
  if (USE_SUPABASE) {
    try {
      const created = await supabaseLib.createServicio(servicio);
      if (created) return created;
    } catch (error) {
      console.log('Fallback a localStorage para crear servicio:', error);
    }
  }
  // Fallback a localStorage
  const servicios = getFromStorage<Servicio[]>(STORAGE_KEYS.SERVICIOS, serviciosIniciales);
  const nuevo: Servicio = { ...servicio, $id: generateId(), createdAt: new Date().toISOString() };
  servicios.push(nuevo);
  saveToStorage(STORAGE_KEYS.SERVICIOS, servicios);
  return nuevo;
}

export async function updateServicio(id: string, data: Partial<Servicio>): Promise<Servicio | null> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.updateServicio(id, data);
      if (success) {
        const servicios = await supabaseLib.getServicios();
        return servicios.find(s => s.$id === id) || null;
      }
    } catch (error) {
      console.log('Fallback a localStorage para actualizar servicio:', error);
    }
  }
  // Fallback a localStorage
  const servicios = getFromStorage<Servicio[]>(STORAGE_KEYS.SERVICIOS, serviciosIniciales);
  const index = servicios.findIndex(s => s.$id === id);
  if (index === -1) return null;
  servicios[index] = { ...servicios[index], ...data };
  saveToStorage(STORAGE_KEYS.SERVICIOS, servicios);
  return servicios[index];
}

export async function deleteServicio(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.deleteServicio(id);
      if (success) return true;
    } catch (error) {
      console.log('Fallback a localStorage para eliminar servicio:', error);
    }
  }
  // Fallback a localStorage
  const servicios = getFromStorage<Servicio[]>(STORAGE_KEYS.SERVICIOS, serviciosIniciales);
  const filtered = servicios.filter(s => s.$id !== id);
  if (filtered.length === servicios.length) return false;
  saveToStorage(STORAGE_KEYS.SERVICIOS, filtered);
  return true;
}

// ============== PEDIDOS ==============
export async function getPedidos(): Promise<Pedido[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseLib.getPedidos();
    } catch (error) {
      console.log('Usando localStorage para pedidos:', error);
    }
  }
  return getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []);
}

export function getPedidosSync(): Pedido[] {
  return getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []);
}

export async function getPedidoById(id: string): Promise<Pedido | undefined> {
  if (USE_SUPABASE) {
    try {
      const pedido = await supabaseLib.getPedidoById(id);
      if (pedido) return pedido;
    } catch (error) {
      console.log('Fallback a localStorage para obtener pedido:', error);
    }
  }
  return getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []).find(p => p.$id === id);
}

export function getNextNumeroFactura(): string {
  const contador = getFromStorage<number>(STORAGE_KEYS.CONTADOR_FACTURA, 0) + 1;
  saveToStorage(STORAGE_KEYS.CONTADOR_FACTURA, contador);
  const fecha = new Date();
  return `F${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(contador).padStart(5, '0')}`;
}

export async function createPedido(pedido: Omit<Pedido, '$id' | 'numeroFactura' | 'createdAt'>): Promise<Pedido> {
  const numeroFactura = USE_SUPABASE ? await supabaseLib.generarNumeroFactura() : getNextNumeroFactura();
  
  if (USE_SUPABASE) {
    try {
      const nuevoPedido = {
        ...pedido,
        numeroFactura,
      };
      const created = await supabaseLib.createPedido(nuevoPedido);
      if (created) return created;
    } catch (error) {
      console.log('Fallback a localStorage para crear pedido:', error);
    }
  }
  
  // Fallback a localStorage
  const pedidos = getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []);
  const nuevo: Pedido = {
    ...pedido,
    $id: generateId(),
    numeroFactura: getNextNumeroFactura(),
    createdAt: new Date().toISOString(),
  };
  pedidos.push(nuevo);
  saveToStorage(STORAGE_KEYS.PEDIDOS, pedidos);
  return nuevo;
}

export async function updatePedido(id: string, data: Partial<Pedido>): Promise<Pedido | null> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.updatePedido(id, data);
      if (success) {
        return await supabaseLib.getPedidoById(id);
      }
    } catch (error) {
      console.log('Fallback a localStorage para actualizar pedido:', error);
    }
  }
  
  // Fallback a localStorage
  const pedidos = getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []);
  const index = pedidos.findIndex(p => p.$id === id);
  if (index === -1) return null;
  pedidos[index] = { ...pedidos[index], ...data };
  saveToStorage(STORAGE_KEYS.PEDIDOS, pedidos);
  return pedidos[index];
}

export async function deletePedido(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.deletePedido(id);
      if (success) return true;
    } catch (error) {
      console.log('Fallback a localStorage para eliminar pedido:', error);
    }
  }
  
  const pedidos = getFromStorage<Pedido[]>(STORAGE_KEYS.PEDIDOS, []);
  const filtered = pedidos.filter(p => p.$id !== id);
  if (filtered.length === pedidos.length) return false;
  saveToStorage(STORAGE_KEYS.PEDIDOS, filtered);
  return true;
}

export async function getPedidosByFecha(fecha: string): Promise<Pedido[]> {
  const pedidos = await getPedidos();
  return pedidos.filter(p => p.fechaRecepcion.startsWith(fecha));
}

export async function getPedidosByRango(fechaInicio: string, fechaFin: string): Promise<Pedido[]> {
  const pedidos = await getPedidos();
  return pedidos.filter(p => p.fechaRecepcion >= fechaInicio && p.fechaRecepcion <= fechaFin);
}

// ============== INGRESOS ==============
export async function getIngresos(): Promise<Ingreso[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseLib.getIngresos();
    } catch (error) {
      console.log('Usando localStorage para ingresos:', error);
    }
  }
  return getFromStorage<Ingreso[]>(STORAGE_KEYS.INGRESOS, []);
}

export async function createIngreso(ingreso: Omit<Ingreso, '$id' | 'createdAt'>): Promise<Ingreso> {
  if (USE_SUPABASE) {
    try {
      const created = await supabaseLib.createIngreso(ingreso);
      if (created) return created;
    } catch (error) {
      console.log('Fallback a localStorage para crear ingreso:', error);
    }
  }
  
  const ingresos = getFromStorage<Ingreso[]>(STORAGE_KEYS.INGRESOS, []);
  const nuevo: Ingreso = { ...ingreso, $id: generateId(), createdAt: new Date().toISOString() };
  ingresos.push(nuevo);
  saveToStorage(STORAGE_KEYS.INGRESOS, ingresos);
  return nuevo;
}

export async function deleteIngreso(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.deleteIngreso(id);
      if (success) return true;
    } catch (error) {
      console.log('Fallback a localStorage para eliminar ingreso:', error);
    }
  }
  
  const ingresos = getFromStorage<Ingreso[]>(STORAGE_KEYS.INGRESOS, []);
  const filtered = ingresos.filter(i => i.$id !== id);
  if (filtered.length === ingresos.length) return false;
  saveToStorage(STORAGE_KEYS.INGRESOS, filtered);
  return true;
}

export async function getIngresosByFecha(fecha: string): Promise<Ingreso[]> {
  const ingresos = await getIngresos();
  return ingresos.filter(i => i.fecha.startsWith(fecha));
}

export async function getIngresosByRango(fechaInicio: string, fechaFin: string): Promise<Ingreso[]> {
  const ingresos = await getIngresos();
  return ingresos.filter(i => i.fecha >= fechaInicio && i.fecha <= fechaFin);
}

// ============== EGRESOS ==============
export async function getEgresos(): Promise<Egreso[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseLib.getEgresos();
    } catch (error) {
      console.log('Usando localStorage para egresos:', error);
    }
  }
  return getFromStorage<Egreso[]>(STORAGE_KEYS.EGRESOS, []);
}

export async function createEgreso(egreso: Omit<Egreso, '$id' | 'createdAt'>): Promise<Egreso> {
  if (USE_SUPABASE) {
    try {
      const created = await supabaseLib.createEgreso(egreso);
      if (created) return created;
    } catch (error) {
      console.log('Fallback a localStorage para crear egreso:', error);
    }
  }
  
  const egresos = getFromStorage<Egreso[]>(STORAGE_KEYS.EGRESOS, []);
  const nuevo: Egreso = { ...egreso, $id: generateId(), createdAt: new Date().toISOString() };
  egresos.push(nuevo);
  saveToStorage(STORAGE_KEYS.EGRESOS, egresos);
  return nuevo;
}

export async function deleteEgreso(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.deleteEgreso(id);
      if (success) return true;
    } catch (error) {
      console.log('Fallback a localStorage para eliminar egreso:', error);
    }
  }
  
  const egresos = getFromStorage<Egreso[]>(STORAGE_KEYS.EGRESOS, []);
  const filtered = egresos.filter(e => e.$id !== id);
  if (filtered.length === egresos.length) return false;
  saveToStorage(STORAGE_KEYS.EGRESOS, filtered);
  return true;
}

export async function getEgresosByFecha(fecha: string): Promise<Egreso[]> {
  const egresos = await getEgresos();
  return egresos.filter(e => e.fecha.startsWith(fecha));
}

export async function getEgresosByRango(fechaInicio: string, fechaFin: string): Promise<Egreso[]> {
  const egresos = await getEgresos();
  return egresos.filter(e => e.fecha >= fechaInicio && e.fecha <= fechaFin);
}

// ============== CONFIGURACIÓN ==============
export async function getConfiguracion(): Promise<Configuracion> {
  if (USE_SUPABASE) {
    try {
      const config = await supabaseLib.getConfiguracion();
      if (config) return config;
    } catch (error) {
      console.log('Usando localStorage para configuración:', error);
    }
  }
  
  const config = getFromStorage<Configuracion | null>(STORAGE_KEYS.CONFIG, null);
  if (!config) {
    saveToStorage(STORAGE_KEYS.CONFIG, configInicial);
    return configInicial;
  }
  return config;
}

export function getConfiguracionSync(): Configuracion {
  const config = getFromStorage<Configuracion | null>(STORAGE_KEYS.CONFIG, null);
  if (!config) {
    saveToStorage(STORAGE_KEYS.CONFIG, configInicial);
    return configInicial;
  }
  return config;
}

export async function updateConfiguracion(data: Partial<Configuracion>): Promise<Configuracion> {
  const configActual = await getConfiguracion();
  const updated = { ...configActual, ...data };
  
  if (USE_SUPABASE) {
    try {
      const success = await supabaseLib.saveConfiguracion(updated);
      if (success) {
        const config = await supabaseLib.getConfiguracion();
        if (config) return config;
      }
    } catch (error) {
      console.log('Fallback a localStorage para actualizar configuración:', error);
    }
  }
  
  saveToStorage(STORAGE_KEYS.CONFIG, updated);
  return updated;
}

// ============== RESUMEN FINANCIERO ==============
export async function getResumenDiario(fecha: string) {
  const [ingresos, egresos, pedidos] = await Promise.all([
    getIngresosByFecha(fecha),
    getEgresosByFecha(fecha),
    getPedidosByFecha(fecha),
  ]);
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);
  
  return {
    fecha,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    balance: totalIngresos - totalEgresos,
    cantidadPedidos: pedidos.length,
    pedidosPendientes: pedidos.filter(p => p.estado !== 'entregado').length,
  };
}

export async function getResumenPorRango(fechaInicio: string, fechaFin: string) {
  const [ingresos, egresos, pedidos] = await Promise.all([
    getIngresosByRango(fechaInicio, fechaFin),
    getEgresosByRango(fechaInicio, fechaFin),
    getPedidosByRango(fechaInicio, fechaFin),
  ]);
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);
  
  return {
    fechaInicio,
    fechaFin,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    balance: totalIngresos - totalEgresos,
    cantidadPedidos: pedidos.length,
    pedidosPendientes: pedidos.filter(p => p.estado !== 'entregado').length,
  };
}

// ============== FACTURAS IMPRESAS ==============
export async function getFacturasImpresas(): Promise<FacturaImpresa[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseLib.getFacturasImpresas();
    } catch (error) {
      console.log('Usando localStorage para facturas impresas:', error);
    }
  }
  return getFromStorage<FacturaImpresa[]>(STORAGE_KEYS.FACTURAS_IMPRESAS, []);
}

export async function createFacturaImpresa(factura: Omit<FacturaImpresa, '$id' | 'createdAt'>): Promise<FacturaImpresa> {
  if (USE_SUPABASE) {
    try {
      const created = await supabaseLib.createFacturaImpresa(factura);
      if (created) return created;
    } catch (error) {
      console.log('Fallback a localStorage para crear factura impresa:', error);
    }
  }
  
  const facturas = getFromStorage<FacturaImpresa[]>(STORAGE_KEYS.FACTURAS_IMPRESAS, []);
  const nueva: FacturaImpresa = { 
    ...factura, 
    $id: generateId(), 
    impresoEn: new Date().toISOString(),
    createdAt: new Date().toISOString() 
  };
  facturas.push(nueva);
  saveToStorage(STORAGE_KEYS.FACTURAS_IMPRESAS, facturas);
  return nueva;
}

// ============== DATOS PARA GRÁFICAS ==============
export async function getDatosGraficaMensual(year: number, month: number) {
  const dias = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let d = 1; d <= daysInMonth; d++) {
    dias.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  
  const [todosIngresos, todosEgresos] = await Promise.all([
    getIngresos(),
    getEgresos(),
  ]);
  
  let balanceAcumulado = 0;
  
  return dias.map(fecha => {
    const ingresosDelDia = todosIngresos.filter(i => i.fecha === fecha).reduce((sum, i) => sum + i.monto, 0);
    const egresosDelDia = todosEgresos.filter(e => e.fecha === fecha).reduce((sum, e) => sum + e.monto, 0);
    balanceAcumulado += ingresosDelDia - egresosDelDia;
    
    return {
      fecha,
      ingresos: ingresosDelDia,
      egresos: egresosDelDia,
      balance: ingresosDelDia - egresosDelDia,
      balanceAcumulado,
    };
  });
}

// ============== CLIENTES ==============
export async function getClientes(): Promise<Cliente[]> {
  return getFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
}

export async function getClienteById(id: string): Promise<Cliente | undefined> {
  const clientes = await getClientes();
  return clientes.find(c => c.$id === id);
}

export async function getClienteByTelefono(telefono: string): Promise<Cliente | undefined> {
  const clientes = await getClientes();
  const telefonoLimpio = telefono.replace(/\D/g, '');
  return clientes.find(c => c.telefono.replace(/\D/g, '') === telefonoLimpio);
}

export async function createCliente(cliente: Omit<Cliente, '$id' | 'createdAt'>): Promise<Cliente> {
  const clientes = getFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
  const nuevo: Cliente = {
    ...cliente,
    $id: generateId(),
    createdAt: new Date().toISOString(),
  };
  clientes.push(nuevo);
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
  return nuevo;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
  const clientes = getFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
  const index = clientes.findIndex(c => c.$id === id);
  if (index === -1) return null;
  clientes[index] = { ...clientes[index], ...data };
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
  return clientes[index];
}

export async function deleteCliente(id: string): Promise<boolean> {
  const clientes = getFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
  const filtered = clientes.filter(c => c.$id !== id);
  if (filtered.length === clientes.length) return false;
  saveToStorage(STORAGE_KEYS.CLIENTES, filtered);
  return true;
}

// Actualizar estadísticas del cliente después de un pedido
export async function actualizarEstadisticasCliente(
  clienteId: string,
  montoPedido: number,
  puntosGanados: number
): Promise<void> {
  const cliente = await getClienteById(clienteId);
  if (!cliente) return;
  
  await updateCliente(clienteId, {
    totalPedidos: cliente.totalPedidos + 1,
    totalGastado: cliente.totalGastado + montoPedido,
    puntosFidelidad: cliente.puntosFidelidad + puntosGanados,
    ultimoPedido: new Date().toISOString(),
  });
}

// Buscar o crear cliente por teléfono (para autocomplete en nuevo pedido)
export async function buscarOCrearCliente(
  nombre: string,
  telefono: string
): Promise<Cliente> {
  const existente = await getClienteByTelefono(telefono);
  if (existente) {
    // Actualizar nombre si es diferente
    if (existente.nombre !== nombre) {
      await updateCliente(existente.$id!, { nombre });
    }
    return existente;
  }
  
  // Crear nuevo cliente
  return createCliente({
    nombre,
    telefono,
    puntosFidelidad: 0,
    totalPedidos: 0,
    totalGastado: 0,
  });
}
