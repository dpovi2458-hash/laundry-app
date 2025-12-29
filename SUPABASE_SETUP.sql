-- =============================================
-- SCRIPT SQL PARA SUPABASE - LAVANDERÍA
-- =============================================
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. TABLA SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT DEFAULT '',
  precio DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(50) DEFAULT 'kg',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_factura VARCHAR(50) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) DEFAULT '',
  servicios JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  notas TEXT DEFAULT '',
  fecha_recepcion DATE NOT NULL,
  fecha_entrega DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA INGRESOS
CREATE TABLE IF NOT EXISTS ingresos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA EGRESOS
CREATE TABLE IF NOT EXISTS egresos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_negocio VARCHAR(255) NOT NULL,
  ruc VARCHAR(50) DEFAULT '',
  direccion TEXT NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  moneda VARCHAR(10) DEFAULT 'S/',
  mensaje_factura TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA FACTURAS IMPRESAS (historial de impresiones)
CREATE TABLE IF NOT EXISTS facturas_impresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  numero_factura VARCHAR(50) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  contenido_html TEXT, -- opcional: guardar el HTML de la factura
  impreso_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================
-- Primero deshabilitamos RLS para permitir acceso público

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_impresas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE ACCESO PÚBLICO
-- =============================================

-- Servicios - Acceso público completo
CREATE POLICY "Acceso público servicios" ON servicios FOR ALL USING (true) WITH CHECK (true);

-- Pedidos - Acceso público completo
CREATE POLICY "Acceso público pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);

-- Ingresos - Acceso público completo
CREATE POLICY "Acceso público ingresos" ON ingresos FOR ALL USING (true) WITH CHECK (true);

-- Egresos - Acceso público completo
CREATE POLICY "Acceso público egresos" ON egresos FOR ALL USING (true) WITH CHECK (true);

-- Configuración - Acceso público completo
CREATE POLICY "Acceso público configuracion" ON configuracion FOR ALL USING (true) WITH CHECK (true);

-- Facturas Impresas - Acceso público completo
CREATE POLICY "Acceso público facturas_impresas" ON facturas_impresas FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar servicios iniciales
INSERT INTO servicios (nombre, descripcion, precio, unidad, activo) VALUES
  ('Lavado por Kilo', 'Lavado completo de ropa por kilogramo', 8.00, 'kg', true),
  ('Lavado de Edredón', 'Lavado de edredón o cobertor', 25.00, 'unidad', true),
  ('Lavado de Frazada', 'Lavado de frazada', 18.00, 'unidad', true),
  ('Planchado', 'Servicio de planchado por prenda', 3.00, 'prenda', true),
  ('Lavado en Seco', 'Lavado en seco para prendas delicadas', 15.00, 'prenda', true),
  ('Lavado de Zapatillas', 'Limpieza de zapatillas', 12.00, 'unidad', true)
ON CONFLICT DO NOTHING;

-- Insertar configuración inicial
INSERT INTO configuracion (nombre_negocio, direccion, telefono, moneda, mensaje_factura) VALUES
  ('Lavandería Express', 'Mz O Lt 23, Chillón - Pte. Piedra', '999 999 999', 'S/', '¡Gracias por su preferencia!')
ON CONFLICT DO NOTHING;
