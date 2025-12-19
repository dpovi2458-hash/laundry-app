# Lavandería Perú - Sistema de Gestión

Sistema web completo para la gestión de una lavandería, desarrollado en Next.js con soporte para Appwrite como base de datos.

## 🚀 Características

- **Dashboard**: Vista general de ingresos, egresos y pedidos del día/semana/mes
- **Gestión de Servicios**: CRUD completo para administrar servicios de lavandería
- **Nuevo Pedido**: Interfaz intuitiva para crear pedidos con carrito de servicios
- **Control de Pedidos**: Lista y gestión de estados de pedidos
- **Finanzas**: Registro y control de ingresos y egresos
- **Reportes**: Análisis diario, semanal y mensual con exportación a CSV
- **Facturas**: Generación e impresión de facturas en blanco y negro
- **Calculadora**: Herramienta de cálculo rápido integrada
- **Configuración**: Personalización del negocio y datos de facturación

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🛠️ Instalación

1. Clona o descarga el proyecto

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de configuración:
```bash
cp .env.local.example .env.local
```

4. Ejecuta en modo desarrollo:
```bash
npm run dev
```

5. Abre http://localhost:3000

## 🌐 Despliegue en Vercel

1. Sube el código a GitHub
2. Conecta el repositorio con Vercel
3. Configura las variables de entorno si usas Appwrite
4. Despliega automáticamente

## 🗄️ Base de Datos

### Modo Local (por defecto)
El sistema usa localStorage para almacenar datos. Ideal para pruebas y uso personal.

### Appwrite (producción)
Para usar Appwrite como base de datos:

1. Crea un proyecto en [Appwrite Cloud](https://cloud.appwrite.io)
2. Crea una base de datos con las siguientes colecciones:
   - `servicios`
   - `pedidos`
   - `ingresos`
   - `egresos`
   - `configuracion`

3. Configura las variables de entorno:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=tu_database_id
```

## 📱 Funcionalidades

### Dashboard
- Resumen de ingresos/egresos del día
- Balance del día, semana y mes
- Lista de pedidos pendientes
- Acceso rápido a nuevo pedido

### Servicios
- Crear, editar y eliminar servicios
- Activar/desactivar servicios
- Configurar precio por kg, prenda o unidad

### Pedidos
- Crear pedidos con múltiples servicios
- Aplicar descuentos
- Registrar método de pago (Efectivo, Yape, Plin, Transferencia)
- Cambiar estado del pedido
- Imprimir factura

### Finanzas
- Registrar ingresos (automático con pedidos)
- Registrar egresos por categoría
- Filtrar por mes
- Ver balance total

### Reportes
- Vista diaria, semanal y mensual
- Exportar a CSV
- Calculadora rápida integrada

### Facturación
- Facturas en formato térmico (80mm)
- Blanco y negro para ahorro de tinta
- Datos del negocio personalizables
- Mensaje de agradecimiento configurable

## 🎨 Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Appwrite** - Base de datos (opcional)
- **React Icons** - Iconos
- **date-fns** - Manejo de fechas

## 📄 Licencia

MIT - Libre para uso personal y comercial
