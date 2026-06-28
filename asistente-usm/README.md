# Asistente USM

App web (PWA) para organizar tu horario, controles y certámenes en la USM. Instalable en tu celular como una app independiente, con tus datos guardados localmente en el dispositivo.

## Cómo probarla en tu computador

Necesitas [Node.js](https://nodejs.org/) instalado (versión 18 o superior).

```bash
npm install
npm run dev
```

Abre la URL que aparece en la terminal (normalmente `http://localhost:5173`).

## Cómo publicarla gratis (para usarla desde el celular)

### Opción A: Vercel (recomendada, más simple)

1. Crea una cuenta gratis en [vercel.com](https://vercel.com) (puedes usar tu cuenta de GitHub).
2. Sube esta carpeta a un repositorio de GitHub.
3. En Vercel, elige "Add New Project" → selecciona el repositorio.
4. Vercel detecta automáticamente que es un proyecto Vite. Deja la configuración por defecto y haz clic en "Deploy".
5. En unos minutos tendrás una URL pública (ej. `asistente-usm.vercel.app`).

### Opción B: Netlify

1. Crea una cuenta gratis en [netlify.com](https://netlify.com).
2. "Add new site" → "Import an existing project" → conecta tu repositorio de GitHub.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Deploy.

### Opción C: GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Instala el plugin: `npm install --save-dev gh-pages`.
3. Agrega en `package.json` dentro de `"scripts"`: `"deploy": "npm run build && gh-pages -d dist"`.
4. En `vite.config.js`, agrega `base: '/NOMBRE-DEL-REPOSITORIO/'`.
5. Corre `npm run deploy`.

## Instalar la app en tu celular (Android e iPhone)

1. Abre la URL pública (de Vercel, Netlify, etc.) en el navegador del celular (Chrome en Android, Safari en iPhone).
2. **Android (Chrome)**: toca el menú (⋮) → "Agregar a pantalla de inicio" o "Instalar app".
3. **iPhone (Safari)**: toca el botón de compartir (□↑) → "Agregar a pantalla de inicio".
4. Quedará un ícono propio en tu celular que abre la app en pantalla completa, sin barra del navegador.

## Notificaciones

Las notificaciones de controles y certámenes (7, 3, 1 y 0 días antes) funcionan mientras la app esté abierta o en segundo plano en el navegador/PWA instalada, y requieren que aceptes el permiso de notificaciones la primera vez (botón "Activar avisos" dentro de la app).

## Datos

Toda la información (horario, evaluaciones, tema claro/oscuro) se guarda localmente en tu celular usando `localStorage`. No se envía a ningún servidor. Si borras los datos del navegador o desinstalas la app, se perderá esa información.
