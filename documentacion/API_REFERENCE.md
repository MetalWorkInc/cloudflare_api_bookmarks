# API Quick Reference

## Base URL
```
Development: http://localhost:8787
Production: https://your-worker.workers.dev
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | API information |
| GET | /bookmarks | List all bookmarks |
| GET | /bookmarks/:id | Get bookmark by ID |
| POST | /bookmarks | Create new bookmark |
| PUT | /bookmarks/:id | Update bookmark |
| DELETE | /bookmarks/:id | Delete bookmark |

## Request/Response Examples

### Create Bookmark
```bash
POST /bookmarks
Content-Type: application/json

{
  "title": "GitHub",
  "url": "https://github.com",
  "description": "Code hosting platform",
  "tags": ["development", "git"]
}

Response (201):
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Code hosting platform",
    "tags": ["development", "git"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Bookmark created successfully"
}
```

### Get All Bookmarks
```bash
GET /bookmarks

Response (200):
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### Update Bookmark
```bash
PUT /bookmarks/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "url": "https://example.com",
  "description": "New description",
  "tags": ["tag1", "tag2"]
}

Response (200):
{
  "success": true,
  "data": {...},
  "message": "Bookmark updated successfully"
}
```

### Delete Bookmark
```bash
DELETE /bookmarks/:id

Response (200):
{
  "success": true,
  "message": "Bookmark deleted successfully",
  "data": {...}
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "errors": [
    "Title is required and must be a non-empty string",
    "URL must be a valid URL"
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Bookmark not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to retrieve bookmarks",
  "message": "..."
}
```

## Required Fields

- **title**: string (non-empty)
- **url**: string (valid URL format)

## Optional Fields

- **description**: string
- **tags**: array of strings
