// Utility helpers: id generation, JSON responses, and validation
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
