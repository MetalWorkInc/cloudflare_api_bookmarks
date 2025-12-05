// Utility helpers: id generation, JSON responses, and validation
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generate encrypted ID using a secret key
export async function generateEncryptedId(secret) {
  const baseId = generateId();
  const encoder = new TextEncoder();
  const data = encoder.encode(baseId + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Return first 16 characters
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Token',
    },
  });
}
