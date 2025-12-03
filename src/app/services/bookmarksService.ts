import { generateId } from '../../lib/utils.js';
import type { Bookmark ,BookmarkInput } from '../models/Bookmark';
import type { Env } from '../types/interface';


export default function makeBookmarksService(env: Env) {
  const kv = env.BOOKMARKS_KV;

  async function list(): Promise<Bookmark[]> {
    const list = await kv.list();
    const bookmarks: Bookmark[] = [];
    for (const key of list.keys) {
      const bookmark = await kv.get<Bookmark>(key.name, { type: 'json' });
      if (bookmark) bookmarks.push(bookmark);
    }
    return bookmarks;
  }

  async function getById(id: string): Promise<Bookmark | null> {
    return await kv.get<Bookmark>(id, { type: 'json' });
  }

  async function create(data: BookmarkInput): Promise<Bookmark> {
    const id = generateId();
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
    await kv.put(id, JSON.stringify(bookmark));
    return bookmark;
  }

  async function update(id: string, data: BookmarkInput): Promise<Bookmark | null> {
    const existing = await getById(id);
    if (!existing) return null;
    const updated: Bookmark = {
      ...existing,
      title: data.title.trim(),
      url: data.url.trim(),
      icon: data.icon ? data.icon.trim() : existing.icon || '',
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      updatedAt: new Date().toISOString(),
    };
    await kv.put(id, JSON.stringify(updated));
    return updated;
  }

  async function remove(id: string): Promise<Bookmark | null> {
    const existing = await getById(id);
    if (!existing) return null;
    await kv.delete(id);
    return existing;
  }

  async function validateBookmark(data: unknown): Promise<string[]> {
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

    return errors;
  }
  
  return { list, getById, create, update, remove, validateBookmark };
}
