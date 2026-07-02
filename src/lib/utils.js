// Utility helpers: id generation, JSON responses, and validation
const ALGO_SHA256 = 'SHA-256';
const HASH_HEX_PAD_LENGTH = 2;

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ACCEPTED = 202;
export const HTTP_STATUS_FOUND = 302;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

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
  const hashHex = hashArray.map(b => b.toString(16).padStart(HASH_HEX_PAD_LENGTH, '0')).join('');
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


export async function encryptKey(key, secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key + secret);
  const hashBuffer = await crypto.subtle.digest(ALGO_SHA256, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(HASH_HEX_PAD_LENGTH, '0')).join('');
}

function isValidBase64(value) {
  const normalized = value.trim();
  if (!normalized || normalized.length % 4 !== 0) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

export function encryptSesionData(serializedData, token) {
  if (!token) return serializedData;
  const dataBytes = new TextEncoder().encode(serializedData);
  const tokenBytes = new TextEncoder().encode(token);
  const output = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i += 1) {
    output[i] = dataBytes[i] ^ tokenBytes[i % tokenBytes.length];
  }
  let binary = '';
  for (const byte of output) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decryptSesionData(encryptedData, token) {
  if (!token) return encryptedData;
  const normalized = encryptedData.trim();

  if (!isValidBase64(normalized)) {
    const error = new TypeError(MSG_INVALID_ENCRYPTED_DATA);
    error.name = 'InvalidEncryptedDataError';
    throw error;
  }

  try {
    const binary = atob(normalized);
    const dataBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      dataBytes[i] = binary.charCodeAt(i);
    }
    const tokenBytes = new TextEncoder().encode(token);
    const output = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i += 1) {
      output[i] = dataBytes[i] ^ tokenBytes[i % tokenBytes.length];
    }
    return new TextDecoder().decode(output);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const decryptError = new TypeError(`${MSG_INVALID_ENCRYPTED_DATA}: ${error.message}`);
    decryptError.name = error.name || 'InvalidEncryptedDataError';
    throw decryptError;
  }
}
