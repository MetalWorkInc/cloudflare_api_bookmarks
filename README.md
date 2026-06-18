# Cloudflare API - Bookmarks & Contact

API RESTful para gestionar bookmarks y datos de contacto, desplegada en Cloudflare Workers.

## 🚀 Inicio Rápido

**Base URL:** `https://your-worker.workers.dev`

**Autenticación:** Todas las peticiones requieren el header `X-API-Token`

```bash
X-API-Token: your-secret-token
```

## 📌 Bookmarks API

### Listar todos los bookmarks
```http
GET /bookmarks
```

**Ejemplo (PowerShell):**
```powershell
(Invoke-WebRequest -Uri "https://your-worker.workers.dev/bookmarks" -Method GET -Headers @{"X-API-Token"="your-token"}).Content
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "GitHub",
      "url": "https://github.com",
      "icon": "💻",
      "description": "Code repository",
      "tags": ["dev", "code"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Crear un bookmark
```http
POST /bookmarks
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Google",
  "url": "https://www.google.com",
  "icon": "🔍",
  "description": "Search engine",
  "tags": ["search", "web"]
}
```

**Ejemplo (PowerShell):**
```powershell
$bookmark = @{
    title = "Google"
    url = "https://www.google.com"
    icon = "🔍"
    description = "Search engine"
    tags = @("search", "web")
} | ConvertTo-Json

(Invoke-WebRequest -Uri "https://your-worker.workers.dev/bookmarks" -Method POST -Headers @{"Content-Type"="application/json"; "X-API-Token"="your-token"} -Body $bookmark).Content
```

### Obtener bookmark por ID
```http
GET /bookmarks/:id
```

### Actualizar bookmark
```http
PUT /bookmarks/:id
Content-Type: application/json
```

### Eliminar bookmark
```http
DELETE /bookmarks/:id
```

## 👤 Contact API

### Obtener información de contacto
```http
GET /curriculum/personalcard
```

Devuelve información básica de contacto: nombre, email, teléfono.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "xyz789",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    }
  ]
}
```

## 🔧 Desarrollo Local

1. **Instalar dependencias:**
```bash
npm install
```

2. **Activar git hooks de protección** (una vez por clonado):
```bash
git config core.hooksPath .githooks
```

> Esto activa el hook `pre-commit` que impide commitear cambios accidentales a `wrangler.toml`.  
> Usa `wrangler.local.toml` (ignorado por git) para tus valores reales de IDs y credenciales.



2. **Ejecutar en modo desarrollo:**
```bash
npm run dev
```

3. **Probar la API:**
```powershell
(Invoke-WebRequest -Uri "http://127.0.0.1:8787/" -Method GET -Headers @{"X-API-Token"="my-local-token-12345"}).Content
```

## 📦 Despliegue

```bash
npm run deploy
```

## 🔐 Configuración

Configura las variables de entorno en `.dev.vars` (desarrollo) o en el dashboard de Cloudflare (producción):

```
API_TOKEN=your-secret-token-here
DROGUIER_VAR_NAME=your-encryption-key
```

## 📄 Licencia

MIT

## 📧 Contacto

Email: tu-email@example.com
cloudflare_api_bookmarks/
├── src/
│   └── index.js          # Worker principal con lógica CRUD
├── wrangler.toml         # Configuración de Cloudflare
├── package.json          # Dependencias del proyecto
└── README.md            # Documentación
```

## 📦 Modelo de Datos

Cada marcador tiene la siguiente estructura:

```javascript
{
  id: string,           // ID único generado automáticamente
  title: string,        // Título del marcador (requerido)
  url: string,          // URL del marcador (requerido, validado)
  description: string,  // Descripción opcional
  tags: array,          // Array de strings para categorización
  createdAt: string,    // Timestamp ISO 8601 de creación
  updatedAt: string     // Timestamp ISO 8601 de última actualización
}
```

## 🔐 Validación

La API incluye validación automática de:
- Campos requeridos (title, url)
- Formato de URL válido
- Tipos de datos correctos

## 🌐 CORS

La API tiene CORS habilitado para permitir llamadas desde cualquier origen. Los headers incluyen:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 🛠️ Tecnologías

- **Cloudflare Workers**: Plataforma serverless
- **KV Storage**: Almacenamiento key-value distribuido
- **Wrangler**: CLI para desarrollo y despliegue

## 📝 Notas

- Los IDs se generan automáticamente usando timestamp + string aleatorio
- Todas las respuestas son en formato JSON
- Los errores incluyen mensajes descriptivos
- Las fechas se almacenan en formato ISO 8601

## 📄 Licencia

MIT
