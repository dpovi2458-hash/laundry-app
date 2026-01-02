# Generación de Íconos PWA

Para que la app funcione como PWA instalable, necesitas generar los íconos en diferentes tamaños.

## Opción 1: Generador Online (Recomendado)

1. Ve a [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Sube el archivo `public/icons/icon.svg`
3. Descarga el paquete de íconos
4. Coloca los archivos en la carpeta `public/icons/`

## Opción 2: Usando ImageMagick (Terminal)

```bash
# Instalar ImageMagick primero
# Windows: choco install imagemagick
# Mac: brew install imagemagick

cd public/icons

# Generar todos los tamaños
for size in 72 96 128 144 152 192 384 512; do
  magick icon.svg -resize ${size}x${size} icon-${size}.png
done
```

## Opción 3: Usando Sharp (Node.js)

```bash
npm install sharp --save-dev
```

Crear script `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('public/icons/icon.svg')
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
});
```

## Tamaños Requeridos

| Tamaño | Uso |
|--------|-----|
| 72x72 | Android Chrome |
| 96x96 | Android Chrome |
| 128x128 | Chrome Web Store |
| 144x144 | MS Tile |
| 152x152 | Apple Touch |
| 192x192 | Android Chrome (splash) |
| 384x384 | Android Chrome (splash) |
| 512x512 | PWA Install Banner |

## Verificar Instalación PWA

1. Abre Chrome DevTools (F12)
2. Ve a Application > Manifest
3. Verifica que no haya errores
4. Ve a Application > Service Workers
5. Verifica que el SW esté registrado

