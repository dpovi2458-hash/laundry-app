# Configuración de Appwrite Cloud

## 1. Crear Base de Datos
- ID: `lavanderia_db`
- Nombre: Lavandería DB

## 2. Crear Colecciones

### Colección: servicios
**ID:** `servicios`

| Atributo | Tipo | Requerido | Default |
|----------|------|-----------|---------|
| nombre | String (255) | Sí | - |
| descripcion | String (500) | No | "" |
| precio | Float | Sí | - |
| unidad | String (50) | Sí | "kg" |
| activo | Boolean | No | true |

### Colección: pedidos
**ID:** `pedidos`

| Atributo | Tipo | Requerido | Default |
|----------|------|-----------|---------|
| numeroFactura | String (50) | Sí | - |
| cliente | String (255) | Sí | - |
| telefono | String (50) | No | "" |
| servicios | String (10000) | Sí | - |
| subtotal | Float | Sí | - |
| descuento | Float | No | 0 |
| total | Float | Sí | - |
| estado | String (50) | Sí | "pendiente" |
| metodoPago | String (50) | Sí | "efectivo" |
| notas | String (1000) | No | "" |
| fechaRecepcion | String (50) | Sí | - |
| fechaEntrega | String (50) | No | "" |

### Colección: ingresos
**ID:** `ingresos`

| Atributo | Tipo | Requerido | Default |
|----------|------|-----------|---------|
| concepto | String (255) | Sí | - |
| monto | Float | Sí | - |
| categoria | String (50) | Sí | - |
| pedidoId | String (50) | No | "" |
| fecha | String (50) | Sí | - |
| notas | String (500) | No | "" |

### Colección: egresos
**ID:** `egresos`

| Atributo | Tipo | Requerido | Default |
|----------|------|-----------|---------|
| concepto | String (255) | Sí | - |
| monto | Float | Sí | - |
| categoria | String (50) | Sí | - |
| fecha | String (50) | Sí | - |
| notas | String (500) | No | "" |

### Colección: configuracion
**ID:** `configuracion`

| Atributo | Tipo | Requerido | Default |
|----------|------|-----------|---------|
| nombreNegocio | String (255) | Sí | - |
| ruc | String (50) | No | "" |
| direccion | String (500) | Sí | - |
| telefono | String (50) | Sí | - |
| email | String (255) | No | "" |
| moneda | String (10) | Sí | "S/" |
| mensajeFactura | String (500) | No | "" |

## 3. IMPORTANTE: Configurar Permisos

Para CADA colección:
1. Ve a la pestaña "Settings" de la colección
2. En la sección "Permissions", agrega:
   - **Role:** `any`
   - **Permisos:** Create, Read, Update, Delete (todos marcados)

O si prefieres usuarios autenticados:
   - **Role:** `users`
   - **Permisos:** Create, Read, Update, Delete

## 4. Variables de Entorno

Asegúrate que tu `.env.local` tenga:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=lavanderia_db
NEXT_PUBLIC_COLLECTION_SERVICIOS=servicios
NEXT_PUBLIC_COLLECTION_PEDIDOS=pedidos
NEXT_PUBLIC_COLLECTION_INGRESOS=ingresos
NEXT_PUBLIC_COLLECTION_EGRESOS=egresos
NEXT_PUBLIC_COLLECTION_CONFIG=configuracion
```

## Errores Comunes

### Error: "Collection not found"
- Verifica que el ID de la colección coincida exactamente
- Verifica que el Database ID sea correcto

### Error: "Missing required attribute"
- Verifica que todos los atributos requeridos estén creados

### Error: "User unauthorized" o "Missing scope"
- Ve a Settings > Permissions en cada colección
- Agrega el rol `any` con todos los permisos

### Error: "Network error"
- Verifica que el endpoint sea correcto
- Si usas una región específica (ej: sfo), usa: `https://sfo.cloud.appwrite.io/v1`
