// Model and helpers for Bookmark entity

export function createBookmarkFromInput(data, id) {
  const now = new Date().toISOString();
  return {
    id,
    title: data.title ? data.title.trim() : '',
    url: data.url ? data.url.trim() : '',
    description: data.description ? data.description.trim() : '',
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
    createdAt: now,
    updatedAt: now,
  };
}

export function buildUpdatedBookmark(existing, data) {
  return {
    ...existing,
    title: data.title ? data.title.trim() : existing.title,
    url: data.url ? data.url.trim() : existing.url,
    description: data.description !== undefined ? (data.description ? data.description.trim() : '') : existing.description,
    tags: data.tags !== undefined ? (Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])) : existing.tags,
    updatedAt: new Date().toISOString(),
  };
}

export function bookmarkSchema() {
  return {
    id: 'string',
    title: 'string',
    url: 'string',
    description: 'string',
    tags: 'array',
    createdAt: 'string',
    updatedAt: 'string',
  };
}

export function validateBookmark(data) {
  const errors = [];
  console.log('Validating bookmark data:', data);
  if (!data || typeof data !== 'object') {
    errors.push('Invalid payload');
    return errors;
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
    errors.push('URL is required and must be a non-empty string');
  } else {
    try {
      new URL(data.url);
    } catch (e) {
      errors.push('URL must be a valid URL');
    }
  }

  return errors;
}
