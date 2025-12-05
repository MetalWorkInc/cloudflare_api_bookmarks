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

### 5. Actualizar wrangler.toml

Edita el archivo `wrangler.toml` y reemplaza los IDs de ejemplo con los IDs reales que obtuviste:

```toml
[[kv_namespaces]]
binding = "STORAGE_KV"
id = "abc123..."  # ← Reemplaza con tu ID real
preview_id = "xyz789..."  # ← Reemplaza con tu preview ID real
```

### 6. Probar Localmente

```bash
npm run dev
```

Esto iniciará el worker en http://localhost:8787

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

## Siguientes Pasos

1. **Personaliza el dominio**: En el dashboard de Cloudflare, puedes configurar un dominio personalizado para tu Worker
2. **Añade autenticación**: Para uso en producción, considera añadir autenticación (API keys, JWT, etc.)
3. **Monitoreo**: Configura alertas y monitoreo en el dashboard de Cloudflare
4. **Rate limiting**: Considera añadir límites de tasa para prevenir abuso

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
