import type { Env } from '../types/interface.js';
import type { PartnersEnv } from '../models/PartnersEnv.js';

async function encryptStorageKey(storageKey: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(storageKey + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

async function encryptDataload(email: string, secret: string, payload: PartnersEnv): Promise<string> {
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

async function decryptDataload(email: string, secret: string, encryptedBase64: string): Promise<PartnersEnv> {
  const key = await deriveEmailKey(email, secret);
  const combined = fromBase64(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(new Uint8Array(decrypted))) as PartnersEnv;
}

export default function makeUserSesionTknService(env: Env) {
  const kv = env.STORAGE_KV;
  const SECRET = env.DROGUIER_VAR_NAME || 'default-secret-key';

  async function getToken(email: string): Promise<string> {
    return encryptStorageKey(email.trim().toLowerCase(), SECRET);
  }

  async function createSession(email: string, partner: PartnersEnv): Promise<string> {
    const token = await getToken(email);
    const encryptedPayload = await encryptDataload(email.trim().toLowerCase(), SECRET, partner);
    await kv.put(token, encryptedPayload);
    return token;
  }

  async function getSession(email: string): Promise<PartnersEnv | null> {
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
    getToken,
    createSession,
    getSession,
  };
}
