# Portafolio de ejercicios: infraestructura técnica de una PWA

Aplicación de ejemplo: **Mi Cuaderno** (tareas y notas). Cada carpeta es un proyecto independiente y completo; el ejercicio N conserva lo del anterior y agrega una capa nueva.

| Carpeta | Tema | Qué se agrega |
|---|---|---|
| `ejercicio-1-manifest/` | Web App Manifest | `manifest.json`, iconos 192 y 512 px, metadatos en el HTML |
| `ejercicio-2-app-shell/` | App Shell y Splash Screen | Header, navegación y contenedor principal, responsivo |
| `ejercicio-3-service-worker/` | Ciclo de vida del SW | `sw.js` con `install`, `activate`, `fetch` y registro asíncrono |
| `ejercicio-4-cache-first/` | Cache API | Precaché del App Shell y estrategia Cache-First |
| `ejercicio-5-offline/` | Estado offline | Fallback a `offline.html` cuando falla la red |

## Cómo ejecutarlo

Los Service Workers solo funcionan en `https://` o en `http://localhost`. Desde la carpeta del ejercicio:

```bash
cd ejercicio-4-cache-first
python -m http.server 8080
# abrir http://localhost:8080
```

También funciona con GitHub Pages (todas las rutas son relativas).

## Verificación en Chrome DevTools

### Ejercicio 1 y 2: manifest, instalabilidad y Splash Screen
1. Abre DevTools (F12) > **Application** > **Manifest**. Comprueba que aparecen nombre, `start_url`, `display: standalone`, colores e iconos sin errores.
2. En la sección **Installability** no debe haber advertencias. Aparece el icono de instalar en la barra de direcciones.
3. Instala la app. Se abre en ventana propia (modo `standalone`, sin barra del navegador y con la barra de título en `theme_color`).
4. **Splash Screen:** Chrome para Android la genera automáticamente al lanzar la app instalada, combinando `background_color` (#F1F5F2), el icono de 512 px y el `name`. Para verla de forma real, abre la URL publicada en un Android, instálala y ábrela desde el escritorio. En escritorio, DevTools no dibuja la splash; ahí se valida que `background_color`, `name` e icono 512 estén bien definidos en el panel Manifest. Toma una captura del panel Manifest como evidencia.

### Ejercicio 3: ciclo de vida
Application > **Service Workers**: verás el estado `activated and is running`. En **Console** aparecen los logs `install`, `activate` y `fetch`. Prueba "Update on reload" y "Unregister".

### Ejercicio 4: caché
Application > **Cache Storage** > `cuaderno-shell-v2`: deben estar los 7 recursos. En **Network**, recarga y verifica que las peticiones muestran *(ServiceWorker)* en la columna Size.

### Ejercicio 5: offline
Application > Service Workers > marca **Offline** (o Network > Throttling > Offline) y recarga: el App Shell carga desde caché. Para ver el fallback, navega a una URL que no esté en caché (por ejemplo `/ruta-inexistente.html`) y aparecerá `offline.html`.

## Estrategia implementada

**Cache-First:** `caches.match(request)` > si existe, se responde desde caché > si no, `fetch()` a la red > si la red falla y es una navegación, se responde `offline.html`; si es otro recurso, un `503`.

**Versionado de caché:** al cambiar `CACHE_NAME` (v2 > v3) el evento `activate` borra las cachés anteriores.

## Evidencias

Las capturas de pantalla van en [`evidencias/`](evidencias/README.md), con la lista de lo que debe mostrar cada una.

## Entrega

Hay un commit por ejercicio. El script `git-commits.sh` los crea en orden:

```bash
bash git-commits.sh
git remote add origin <URL-del-repositorio>
git push -u origin main
```

Si prefieres hacerlo a mano, estos son los comandos que ejecuta:


```bash
git init
git add README.md .gitignore evidencias && git commit -m "docs: README, estructura y evidencias"
git add ejercicio-1-manifest && git commit -m "feat(ej1): manifest.json e iconos 192/512"
git add ejercicio-2-app-shell && git commit -m "feat(ej2): App Shell responsivo con tareas y notas (IndexedDB)"
git add ejercicio-3-service-worker && git commit -m "feat(ej3): registro y ciclo de vida del Service Worker"
git add ejercicio-4-cache-first && git commit -m "feat(ej4): precaché y estrategia Cache-First"
git add ejercicio-5-offline && git commit -m "feat(ej5): fallback offline.html y estado de conexión"
git branch -M main
```

## Base de datos (IndexedDB)

Tareas y notas se guardan en **IndexedDB** (base `cuaderno-db`, almacenes `tareas` y `notas`, clave `id`), por eso siguen disponibles sin conexión. Para verlas: DevTools > Application > **IndexedDB** > `cuaderno-db`.

Si el navegador tenía datos de la versión anterior en `localStorage`, la app los pasa a IndexedDB automáticamente la primera vez.
