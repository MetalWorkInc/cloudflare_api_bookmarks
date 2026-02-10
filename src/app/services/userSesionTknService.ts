import type { Env } from '../types/interface.js';
import type { PartnersEnvSession } from '../models/PartnersEnv.js';

async function deriveEmailKey(email: string, secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(email),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(secret),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function deriveSecretKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('email-token-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function deterministicIv(email: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer).slice(0, 12);
}

async function encryptEmail(email: string, secret: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const key = await deriveSecretKey(secret);
  const iv = await deterministicIv(normalizedEmail, secret);
  const plaintext = encoder.encode(normalizedEmail);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return toBase64(combined);
}

async function decryptEmail(token: string, secret: string): Promise<string | null> {
  try {
    const key = await deriveSecretKey(secret);
    const combined = fromBase64(token);
    if (combined.byteLength <= 12) return null;
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(decrypted));
  } catch (error) {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function encryptDataload(email: string, secret: string, payload: PartnersEnvSession): Promise<string> {
  const encoder = new TextEncoder();
  const key = await deriveEmailKey(email, secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return toBase64(combined);
}

async function decryptDataload(email: string, secret: string, encryptedBase64: string): Promise<PartnersEnvSession> {
  const key = await deriveEmailKey(email, secret);
  const combined = fromBase64(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(new Uint8Array(decrypted))) as PartnersEnvSession;
}

export default function makeUserSesionTknService(env: Env) {
  const kv = env.STORAGE_KV;
  const SECRET = env.DROGUIER_VAR_NAME || 'default-secret-key';

  async function getToken(email: string): Promise<string> {
    return encryptEmail(email, SECRET);
  }

  async function getEmail(token: string): Promise<string | null> {
    if (!token) return null;
    return decryptEmail(token, SECRET);
  }

  async function createSession(email: string, partner: PartnersEnvSession): Promise<string> {
    const token = await getToken(email);
    const encryptedPayload = await encryptDataload(email.trim().toLowerCase(), SECRET, partner);
    await kv.put(token, encryptedPayload);
    return token;
  }

  async function getSessionByToken(token: string): Promise<PartnersEnvSession | null> {
    const encrypted = await kv.get(token);
    const email = await getEmail(token);
    if (!encrypted || !email) return null;
    try {
      return await decryptDataload(email.trim().toLowerCase(), SECRET, encrypted);
    } catch (error) {
      return null;
    }
  }
  
  async function getSessionByEmail(email: string): Promise<PartnersEnvSession | null> {
    const token = await getToken(email);
    const encrypted = await kv.get(token);
    if (!encrypted) return null;
    try {
      return await decryptDataload(email.trim().toLowerCase(), SECRET, encrypted);
    } catch (error) {
      return null;
    }
  }

  return {
    getEmail,
    getToken,
    createSession,
    getSessionByToken,
    getSessionByEmail,
  };
}
