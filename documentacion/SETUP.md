# Setup Guide - Cloudflare API Bookmarks

Esta guía te ayudará a configurar y desplegar tu API de marcadores en Cloudflare Workers.

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Cloudflare (gratuita)

## Pasos de Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Cloudflare Account

1. Inicia sesión en tu cuenta de Cloudflare: https://dash.cloudflare.com
2. Si no tienes una cuenta, créala gratuitamente

### 3. Autenticar Wrangler

```bash
npx wrangler login
```

Esto abrirá tu navegador para autenticar Wrangler con tu cuenta de Cloudflare.

### 4. Crear KV Namespace

El KV namespace es donde se almacenarán los marcadores.

#### Para Producción:
```bash
npx wrangler kv:namespace create "STORAGE_KV"
```

#### Para Preview/Development:
```bash
npx wrangler kv:namespace create "STORAGE_KV" --preview
```

Los comandos anteriores te darán IDs como estos:
```
{ binding = "STORAGE_KV", id = "abc123..." }
{ binding = "STORAGE_KV", preview_id = "xyz789..." }
```

### 5. Elegir el archivo de entorno

Para este repositorio hay tres archivos relevantes:

- `wrangler.toml`: archivo que Cloudflare Build usa en el deploy automático.
- `wrangler.base.toml`: plantilla pública de referencia.
- `wrangler.local.toml`: archivo local con overrides, ignorado por git.

Si vas a probar en local, copia los IDs reales en `wrangler.local.toml`. Si vas a desplegar por Cloudflare Build, asegúrate de que `wrangler.toml` ya contenga los IDs reales y no placeholders.

Ejemplo de bindings para KV:

```toml
[[kv_namespaces]]
binding = "STORAGE_KV"
id = "abc123..."
preview_id = "xyz789..."
```

### 6. Probar Localmente

```bash
npm run dev
```

Esto iniciará el worker en http://localhost:8787

Si necesitas forzar un archivo específico en local, usa el config correspondiente en `wrangler`.

### 7. Probar los Endpoints

Puedes probar la API usando curl, Postman, o tu navegador:

```bash
# Ver información de la API
curl http://localhost:8787/

# Crear un marcador
curl -X POST http://localhost:8787/bookmarks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Plataforma de desarrollo",
    "tags": ["desarrollo", "git"]
  }'

# Listar todos los marcadores
curl http://localhost:8787/bookmarks

# Obtener un marcador específico (reemplaza {id} con un ID real)
curl http://localhost:8787/bookmarks/{id}

# Actualizar un marcador
curl -X PUT http://localhost:8787/bookmarks/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "GitHub - Actualizado",
    "url": "https://github.com",
    "description": "Nueva descripción"
  }'

# Eliminar un marcador
curl -X DELETE http://localhost:8787/bookmarks/{id}
```

### 8. Desplegar a Producción

Una vez que hayas probado localmente, despliega a producción:

```bash
npm run deploy
```

Wrangler te dará una URL como: `https://cloudflare-api-bookmarks.your-subdomain.workers.dev`

## Verificación

Ejecuta los tests incluidos para verificar que todo funciona correctamente:

```bash
npm test
```

## D1 Contable: flujo Local -> Produccion

Para validar primero en local y luego reproducir en produccion, usa los scripts SQL numerados dentro de [datastorages/contable/01_schema.sql](datastorages/contable/01_schema.sql), [datastorages/contable/02_seed_base_config.sql](datastorages/contable/02_seed_base_config.sql), [datastorages/contable/03_views.sql](datastorages/contable/03_views.sql) y [datastorages/contable/04_generar_asientos.sql](datastorages/contable/04_generar_asientos.sql).

1. Ejecutar todo en local:

```bash
npm run d1:contable:local:all
```

2. Validar estructura local (tablas y vistas):

```bash
npm run d1:contable:local:tables
npm run d1:contable:local:views
```

3. Validar datos contables locales (ejemplo):

```bash
npx wrangler d1 execute datastoraged01 --local --command="SELECT COUNT(*) AS total_asientos FROM cont_asientos;"
npx wrangler d1 execute datastoraged01 --local --command="SELECT COUNT(*) AS total_detalles FROM cont_asientos_detalle;"
```

4. Cuando la validacion local este OK, reproducir en produccion:

```bash
npm run d1:contable:remote:all
```

5. Validar en produccion (consulta de control):

```bash
npx wrangler d1 execute datastoraged01 --remote --command="SELECT COUNT(*) AS total_asientos FROM cont_asientos;"
```

Notas:
- El script [datastorages/contable/01_schema.sql](datastorages/contable/01_schema.sql) hace DROP TABLE IF EXISTS para re-ejecucion segura, por lo que reinicia ese dominio de tablas.
- Ejecuta siempre en orden numerado para mantener dependencias y relaciones.

## Siguientes Pasos

1. **Personaliza el dominio**: En el dashboard de Cloudflare, puedes configurar un dominio personalizado para tu Worker
2. **Añade autenticación**: Para uso en producción, considera añadir autenticación (API keys, JWT, etc.)
3. **Monitoreo**: Configura alertas y monitoreo en el dashboard de Cloudflare
4. **Rate limiting**: Considera añadir límites de tasa para prevenir abuso

## Notas de despliegue

- El deploy automático de Cloudflare toma el `wrangler.toml` versionado en el repo.
- `wrangler.local.toml` no se sube al repositorio y no afecta el deploy remoto.
- Los secretos deben vivir en `.dev.vars` o en Cloudflare Secrets, no en archivos públicos.

## Solución de Problemas

### Error: "No KV namespace found"
- Verifica que creaste el KV namespace correctamente
- Verifica que los IDs en `wrangler.toml` son correctos

### Error: "Authentication required"
- Ejecuta `npx wrangler login` para autenticar

### Error: "Invalid URL"
- Asegúrate de que las URLs incluyen el protocolo (http:// o https://)

## Recursos Adicionales

- [Documentación de Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentación de KV](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Costos

- El plan gratuito de Cloudflare Workers incluye:
  - 100,000 requests por día
  - 1 GB de KV storage
  - Más que suficiente para uso personal

¡Listo! Tu API de marcadores está configurada y lista para usar.
