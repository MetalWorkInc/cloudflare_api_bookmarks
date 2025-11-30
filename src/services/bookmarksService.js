import { generateId } from '../lib/utils.js';

export default function makeBookmarksService(env) {
  const kv = env.BOOKMARKS_KV;

  async function list() {
    const list = await kv.list();
    const bookmarks = [];
    for (const key of list.keys) {
      const bookmark = await kv.get(key.name, { type: 'json' });
      if (bookmark) bookmarks.push(bookmark);
    }
    return bookmarks;
  }

  async function getById(id) {
    return await kv.get(id, { type: 'json' });
  }

  async function create(data) {
    const id = generateId();
    const bookmark = {
      id,
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.put(id, JSON.stringify(bookmark));
    return bookmark;
  }

  async function update(id, data) {
    const existing = await getById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      updatedAt: new Date().toISOString(),
    };
    await kv.put(id, JSON.stringify(updated));
    return updated;
  }

  async function remove(id) {
    const existing = await getById(id);
    if (!existing) return null;
    await kv.delete(id);
    return existing;
  }

  return { list, getById, create, update, remove };
}
