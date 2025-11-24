# Cloudflare API Bookmarks

Una API simple y eficiente para gestionar marcadores (bookmarks) utilizando Cloudflare Workers y KV storage.

## 📝 Descripción

Este proyecto proporciona una API RESTful completa para operaciones CRUD (Create, Read, Update, Delete) sobre marcadores web. Está diseñado para ser consumido por una aplicación web frontend y se ejecuta en Cloudflare Workers para un rendimiento óptimo y distribución global.

## ✨ Características

- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar marcadores
- ✅ **Validación de datos**: Validación de URLs y campos requeridos
- ✅ **CORS habilitado**: Listo para ser consumido desde cualquier origen
- ✅ **Almacenamiento KV**: Utiliza Cloudflare KV para persistencia de datos
- ✅ **Timestamps automáticos**: Seguimiento de creación y actualización
- ✅ **Soporte para tags**: Organiza tus marcadores con etiquetas
- ✅ **Respuestas JSON**: Formato consistente de respuestas

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/MetalWorkInc/cloudflare_api_bookmarks.git
cd cloudflare_api_bookmarks
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura tu KV namespace en `wrangler.toml`:
   - Crea un KV namespace en tu dashboard de Cloudflare
   - Actualiza el `id` y `preview_id` en `wrangler.toml`

4. Ejecuta en modo desarrollo:
```bash
npm run dev
```

5. Despliega a producción:
```bash
npm run deploy
```

## 📚 API Endpoints

### Información de la API
```http
GET /
```

Devuelve información sobre la API y sus endpoints disponibles.

### Listar todos los marcadores
```http
GET /bookmarks
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "GitHub",
      "url": "https://github.com",
      "description": "Plataforma de desarrollo",
      "tags": ["desarrollo", "git"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Obtener un marcador específico
```http
GET /bookmarks/:id
```

**Parámetros:**
- `id` - ID del marcador

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Plataforma de desarrollo",
    "tags": ["desarrollo", "git"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Crear un nuevo marcador
```http
POST /bookmarks
```

**Body (JSON):**
```json
{
  "title": "GitHub",
  "url": "https://github.com",
  "description": "Plataforma de desarrollo",
  "tags": ["desarrollo", "git"]
}
```

**Campos:**
- `title` (requerido): Título del marcador
- `url` (requerido): URL válida del marcador
- `description` (opcional): Descripción del marcador
- `tags` (opcional): Array de etiquetas

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Plataforma de desarrollo",
    "tags": ["desarrollo", "git"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Bookmark created successfully"
}
```

### Actualizar un marcador
```http
PUT /bookmarks/:id
```

**Parámetros:**
- `id` - ID del marcador a actualizar

**Body (JSON):**
```json
{
  "title": "GitHub - Actualizado",
  "url": "https://github.com",
  "description": "Nueva descripción",
  "tags": ["desarrollo", "git", "código"]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "GitHub - Actualizado",
    "url": "https://github.com",
    "description": "Nueva descripción",
    "tags": ["desarrollo", "git", "código"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Bookmark updated successfully"
}
```

### Eliminar un marcador
```http
DELETE /bookmarks/:id
```

**Parámetros:**
- `id` - ID del marcador a eliminar

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Bookmark deleted successfully",
  "data": {
    "id": "abc123",
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Plataforma de desarrollo",
    "tags": ["desarrollo", "git"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 Estructura del Proyecto

```
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
