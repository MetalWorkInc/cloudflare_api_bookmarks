/**
 * Entry point for Cloudflare Worker - delegates to resource routers
 */
import makeBookmarksRouter from './routes/bookmarks';
import makeCurriculumVitaeRouter from './routes/curriculumVitae';
import { jsonResponse } from './lib/utils.js';

// Router to handle different routes (delegates to modules)
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
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Token',
      },
    });
  }

  // Validate API Token (skip for GET on root endpoint)
  //if (!(path === '/' && method === 'GET')) {
    const token = request.headers.get('X-API-Token');
    const validToken = env.API_TOKEN || 'your-secret-token-here-change-in-production';
    
    if (!token) {
      return jsonResponse({
        success: false,
        error: 'Unauthorized',
        message: 'API token is required. Please include X-API-Token header.',
      }, 401);
    }
    
    if (token !== validToken) {
      return jsonResponse({
        success: false,
        error: 'Forbidden',
        message: 'Invalid API token.',
      }, 403);
    }
  //}

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
        'GET /curriculum': 'Get all curriculum vitae',
        'GET /curriculum/:id': 'Get curriculum vitae by ID',
        'POST /curriculum': 'Create new curriculum vitae',
        'PUT /curriculum/:id': 'Update curriculum vitae',
        'DELETE /curriculum/:id': 'Delete curriculum vitae',
      },
    });
  }

  // Mount bookmarks router
  if (path.startsWith('/bookmarks')) {
    const router = makeBookmarksRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
  }

  
  // Mount curriculum vitae router
  if (path.startsWith('/curriculum')) {
    const router = makeCurriculumVitaeRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
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
