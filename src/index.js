/**
 * Entry point for Cloudflare Worker - delegates to resource routers
 */
import makeBookmarksRouter from './routes/bookmarks';
import makeCurriculumVitaeRouter from './routes/curriculumVitae';
import makePartnersEnvRouter from './routes/partnersEnv';
import makeUserSesionRouter from './routes/userSesion';
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
      name: 'Cloudflare Statics API',
      version: '1.0.1',
      contact: 'droguier@gmail.com',
      endpoints: {
        'GET /': 'Get info',
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

  // Mount partners environment router
  if (path.startsWith('/partners')) {
    const router = makePartnersEnvRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
  }

  // Mount user session router
  if (path.startsWith('/userSesion')) {
    const router = makeUserSesionRouter(env);
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
