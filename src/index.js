/**
 * Cloudflare Worker API for Bookmarks CRUD
 * Manages bookmarks with Create, Read, Update, Delete operations
 */

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Validate bookmark data
function validateBookmark(data) {
  const errors = [];
  
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

// GET all bookmarks
async function getAllBookmarks(env) {
  try {
    const list = await env.BOOKMARKS_KV.list();
    const bookmarks = [];
    
    for (const key of list.keys) {
      const bookmark = await env.BOOKMARKS_KV.get(key.name, { type: 'json' });
      if (bookmark) {
        bookmarks.push(bookmark);
      }
    }
    
    return jsonResponse({
      success: true,
      data: bookmarks,
      count: bookmarks.length,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to retrieve bookmarks',
      message: error.message,
    }, 500);
  }
}

// GET bookmark by ID
async function getBookmarkById(env, id) {
  try {
    const bookmark = await env.BOOKMARKS_KV.get(id, { type: 'json' });
    
    if (!bookmark) {
      return jsonResponse({
        success: false,
        error: 'Bookmark not found',
      }, 404);
    }
    
    return jsonResponse({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to retrieve bookmark',
      message: error.message,
    }, 500);
  }
}

// POST - Create new bookmark
async function createBookmark(env, request) {
  try {
    const data = await request.json();
    
    // Validate input
    const errors = validateBookmark(data);
    if (errors.length > 0) {
      return jsonResponse({
        success: false,
        errors,
      }, 400);
    }
    
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
    
    await env.BOOKMARKS_KV.put(id, JSON.stringify(bookmark));
    
    return jsonResponse({
      success: true,
      data: bookmark,
      message: 'Bookmark created successfully',
    }, 201);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to create bookmark',
      message: error.message,
    }, 500);
  }
}

// PUT - Update bookmark
async function updateBookmark(env, id, request) {
  try {
    const existingBookmark = await env.BOOKMARKS_KV.get(id, { type: 'json' });
    
    if (!existingBookmark) {
      return jsonResponse({
        success: false,
        error: 'Bookmark not found',
      }, 404);
    }
    
    const data = await request.json();
    
    // Validate input
    const errors = validateBookmark(data);
    if (errors.length > 0) {
      return jsonResponse({
        success: false,
        errors,
      }, 400);
    }
    
    const updatedBookmark = {
      ...existingBookmark,
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description ? data.description.trim() : '',
      tags: data.tags || [],
      updatedAt: new Date().toISOString(),
    };
    
    await env.BOOKMARKS_KV.put(id, JSON.stringify(updatedBookmark));
    
    return jsonResponse({
      success: true,
      data: updatedBookmark,
      message: 'Bookmark updated successfully',
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to update bookmark',
      message: error.message,
    }, 500);
  }
}

// DELETE bookmark
async function deleteBookmark(env, id) {
  try {
    const existingBookmark = await env.BOOKMARKS_KV.get(id, { type: 'json' });
    
    if (!existingBookmark) {
      return jsonResponse({
        success: false,
        error: 'Bookmark not found',
      }, 404);
    }
    
    await env.BOOKMARKS_KV.delete(id);
    
    return jsonResponse({
      success: true,
      message: 'Bookmark deleted successfully',
      data: existingBookmark,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Failed to delete bookmark',
      message: error.message,
    }, 500);
  }
}

// Router to handle different routes
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  // Route: GET /bookmarks - Get all bookmarks
  if (path === '/bookmarks' && method === 'GET') {
    return getAllBookmarks(env);
  }
  
  // Route: POST /bookmarks - Create bookmark
  if (path === '/bookmarks' && method === 'POST') {
    return createBookmark(env, request);
  }
  
  // Route: GET /bookmarks/:id - Get specific bookmark
  const getMatch = path.match(/^\/bookmarks\/([^\/]+)$/);
  if (getMatch && method === 'GET') {
    return getBookmarkById(env, getMatch[1]);
  }
  
  // Route: PUT /bookmarks/:id - Update bookmark
  if (getMatch && method === 'PUT') {
    return updateBookmark(env, getMatch[1], request);
  }
  
  // Route: DELETE /bookmarks/:id - Delete bookmark
  if (getMatch && method === 'DELETE') {
    return deleteBookmark(env, getMatch[1]);
  }
  
  // Root endpoint - API info
  if (path === '/' && method === 'GET') {
    return jsonResponse({
      name: 'Cloudflare Bookmarks API',
      version: '1.0.0',
      endpoints: {
        'GET /bookmarks': 'Get all bookmarks',
        'GET /bookmarks/:id': 'Get bookmark by ID',
        'POST /bookmarks': 'Create new bookmark',
        'PUT /bookmarks/:id': 'Update bookmark',
        'DELETE /bookmarks/:id': 'Delete bookmark',
      },
    });
  }
  
  // 404 - Route not found
  return jsonResponse({
    success: false,
    error: 'Not found',
    message: `Route ${method} ${path} not found`,
  }, 404);
}

// Main export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: 'Internal server error',
        message: error.message,
      }, 500);
    }
  },
};
