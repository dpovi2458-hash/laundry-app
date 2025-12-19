# 🚀 Guía de Despliegue en Vercel - Lavandería App

## Paso 1: Preparar Supabase para Producción

### 1.1 Verificar configuración de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: `alcvaouelytrpyzwaroy`
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL**: `https://alcvaouelytrpyzwaroy.supabase.co`
   - **anon public key**: La key que comienza con `eyJhbGci...`

### 1.2 Verificar las tablas en Supabase

Asegúrate de que todas las tablas estén creadas ejecutando el script `SUPABASE_SETUP.sql` en el SQL Editor de Supabase.

---

## Paso 2: Configurar Vercel

### 2.1 Conectar repositorio

1. Ve a [Vercel](https://vercel.com)
2. Click en **Add New** > **Project**
3. Importa tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona el repositorio de la lavandería

### 2.2 Configurar Variables de Entorno

En Vercel, ve a **Settings** > **Environment Variables** y agrega:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://alcvaouelytrpyzwaroy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsY3Zhb3VlbHl0cnB5endhcm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDY4NDgsImV4cCI6MjA4MTY4Mjg0OH0.4Uj74YSFw4rylM-k-PHj1jkhfTqR4Dpgy0RAXYMdLFk` |

> ⚠️ **Importante**: Asegúrate de seleccionar **todos los entornos** (Production, Preview, Development)

### 2.3 Configuración del Build

Vercel detectará automáticamente Next.js. Verifica estos valores:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (o dejarlo vacío para auto-detect)
- **Output Directory**: `.next` (o dejarlo vacío para auto-detect)
- **Install Command**: `npm install`

---

## Paso 3: Deploy

1. Click en **Deploy**
2. Espera a que el build termine
3. ¡Tu app estará disponible en `tu-proyecto.vercel.app`!

---

## Paso 4: Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a **Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

---

## 🔧 Troubleshooting

### Error: "Supabase no configurado"
- Verifica que las variables de entorno estén correctamente configuradas en Vercel
- Asegúrate de que no hay espacios extra en los valores
- Redespliega después de agregar las variables

### Error: "Error de conexión a la base de datos"
- Verifica que las tablas existan en Supabase
- Verifica que las políticas RLS estén configuradas correctamente
- Revisa los logs en Supabase Dashboard

### Error en el Build
- Revisa los logs del build en Vercel
- Ejecuta `npm run build` localmente para ver errores
- Verifica que todas las dependencias estén en `package.json`

---

## 📝 Notas Adicionales

### Variables de Entorno Actuales

```bash
NEXT_PUBLIC_SUPABASE_URL=https://alcvaouelytrpyzwaroy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar producción local
npm run start
```

---

## ✅ Checklist de Despliegue

- [ ] Supabase configurado con todas las tablas
- [ ] Políticas RLS configuradas
- [ ] Variables de entorno en Vercel
- [ ] Build exitoso
- [ ] Funcionalidad probada en producción
