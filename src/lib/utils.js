// Utility helpers: id generation, JSON responses, and validation
const ALGO_SHA256 = 'SHA-256';

const HTTP_STATUS_OK = 200;

const CONTENT_TYPE_JSON = 'application/json';
const CORS_ALLOW_ORIGIN = '*';
const CORS_ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS = 'Content-Type, X-API-Token';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generate encrypted ID using a secret key
export async function generateEncryptedId(secret) {
  const baseId = generateId();
  const encoder = new TextEncoder();
  const data = encoder.encode(baseId + secret);
  const hashBuffer = await crypto.subtle.digest(ALGO_SHA256, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Return first 16 characters
}

export function jsonResponse(data, status = HTTP_STATUS_OK) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
      'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': CORS_ALLOW_METHODS,
      'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    },
  });
}
