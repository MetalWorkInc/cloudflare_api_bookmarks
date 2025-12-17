import { generateEncryptedId } from '../../lib/utils.js';
import type { Bookmark ,BookmarkInput } from '../models/Bookmark';
import type { Env } from '../types/interface';

async function encryptStorageKey(storageKey: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(storageKey + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function makeBookmarksService(env: Env) {
  const STORAGE_KEY = "BOOKMARKS_STORAGE";
  const kv = env.STORAGE_KV;
  const SECRET = env.DROGUIER_VAR_NAME || 'default-secret-key';

  async function getEncryptedKey(): Promise<string> {
    return await encryptStorageKey(STORAGE_KEY, SECRET);
  }

  async function getAllBookmarks(): Promise<Bookmark[]> {
    const encryptedKey = await getEncryptedKey();
    const data = await kv.get<Bookmark[]>(encryptedKey, { type: 'json' });
    return data || [];
  }

  async function saveAllBookmarks(bookmarks: Bookmark[]): Promise<void> {
    const encryptedKey = await getEncryptedKey();
    await kv.put(encryptedKey, JSON.stringify(bookmarks));
  }

  async function list(): Promise<Bookmark[]> {
    return await getAllBookmarks();
  }

  async function getById(id: string): Promise<Bookmark | null> {
    const bookmarks = await getAllBookmarks();
    return bookmarks.find(b => b.id === id) || null;
  }

  async function create(data: BookmarkInput): Promise<Bookmark> {
    const bookmarks = await getAllBookmarks();
    const id = await generateEncryptedId(SECRET);
    const bookmark: Bookmark = {
      id,
      title: data.title.trim(),
      url: data.url.trim(),
      icon: data.icon ? data.icon.trim() : '',
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    bookmarks.push(bookmark);
    await saveAllBookmarks(bookmarks);
    return bookmark;
  }

  async function update(id: string, data: BookmarkInput): Promise<Bookmark | null> {
    const bookmarks = await getAllBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    const updated: Bookmark = {
      ...bookmarks[index],
      title: data.title.trim(),
      url: data.url.trim(),
      icon: data.icon ? data.icon.trim() : bookmarks[index].icon || '',
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      updatedAt: new Date().toISOString(),
    };
    bookmarks[index] = updated;
    await saveAllBookmarks(bookmarks);
    return updated;
  }

  async function remove(id: string): Promise<Bookmark | null> {
    const bookmarks = await getAllBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    const deleted = bookmarks[index];
    bookmarks.splice(index, 1);
    await saveAllBookmarks(bookmarks);
    return deleted;
  }

  async function checkDuplicateTitle(title: string, excludeId?: string): Promise<boolean> {
    const bookmarks = await getAllBookmarks();
    return bookmarks.some(b => 
      b.title.toLowerCase().trim() === title.toLowerCase().trim() && 
      b.id !== excludeId
    );
  }

  async function checkDuplicateUrl(url: string, excludeId?: string): Promise<boolean> {
    const bookmarks = await getAllBookmarks();
    return bookmarks.some(b => 
      b.url.toLowerCase().trim() === url.toLowerCase().trim() && 
      b.id !== excludeId
    );
  }

  async function validateBookmark(data: unknown, excludeId?: string): Promise<string[]> {
    const errors: string[] = [];
    console.log('Validating bookmark data:', data);
    
    if (!data || typeof data !== 'object') {
        errors.push('Invalid payload');
        return errors;
    }

    const bookmark = data as Partial<BookmarkInput>;

    if (!bookmark.title || typeof bookmark.title !== 'string' || bookmark.title.trim() === '') {
        errors.push('Title is required and must be a non-empty string');
    }

    if (!bookmark.url || typeof bookmark.url !== 'string' || bookmark.url.trim() === '') {
        errors.push('URL is required and must be a non-empty string');
    } else {
        try {
        new URL(bookmark.url);
        } catch (e) {
        errors.push('URL must be a valid URL');
        }
    }

    // Validar duplicados solo si los campos básicos son válidos
    if (bookmark.title && typeof bookmark.title === 'string' && bookmark.title.trim() !== '') {
      const titleExists = await checkDuplicateTitle(bookmark.title, excludeId);
      if (titleExists) {
        errors.push('A bookmark with this title already exists');
      }
    }

    if (bookmark.url && typeof bookmark.url === 'string' && bookmark.url.trim() !== '') {
      try {
        new URL(bookmark.url);
        const urlExists = await checkDuplicateUrl(bookmark.url, excludeId);
        if (urlExists) {
          errors.push('A bookmark with this URL already exists');
        }
      } catch (e) {
        // El error de URL ya fue agregado arriba
      }
    }

    return errors;
  }
  
  return { list, getById, create, update, remove, validateBookmark, checkDuplicateTitle, checkDuplicateUrl };
}
