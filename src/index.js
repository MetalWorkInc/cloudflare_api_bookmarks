/**
 * Entry point for Cloudflare Worker - delegates to resource routers
 */
import makeBookmarksRouter from './routes/bookmarks';
import makeCurriculumVitaeRouter from './routes/curriculumVitae';
import makePartnersEnvRouter from './routes/partnersEnv';
import makeUserSesionRouter from './routes/userSesion';
import makeGoogleAuthLogRouter from './routes/googleAuthLog';
import { jsonResponse } from './lib/utils.js';
import makeUserSesionTknService from './app/services/userSesionTknService';

// Router to handle different routes (delegates to modules)
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Initialize services
  const userSesionTknService = makeUserSesionTknService(env);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Token, X-Session-Token',
      },
    });
  }

  // Validate API Token (skip for GET on root endpoint)
  const tokenApi = request.headers.get('X-API-Token');
  const validTokenApi = env.API_TOKEN || 'x-api-token-value'; // Default token for testing
  const SECRET = env.DROGUIER_VAR_NAME || 'default-secret-key';
  
  if (!tokenApi) {
    return jsonResponse({
      success: false,
      error: 'Unauthorized',
      message: 'API token is required. Please include X-API-Token header.',
    }, 401);
  }
  
  if (validTokenApi !== tokenApi) {
    return jsonResponse({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API token.',
    }, 403);
  }

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

  // Session validation for protected routes
  if (path.startsWith('/bookmarks') 
    || path.startsWith('/partners')
    || path.startsWith('/googleAuthLog')) {
  
    const sessionToken = request.headers.get('X-Session-Token');    

    if (!sessionToken) {
      return jsonResponse({
        success: false,
        error: 'Unauthorized',
        message: 'Session is required. Include X-Session-Token header.',
      }, 401);
    }
    
    const sessionEmail = await userSesionTknService.getEmail(sessionToken);
    if (!sessionEmail) {
      return jsonResponse({
        success: false,
        error: 'Forbidden',
        message: 'Invalid session token.',
      }, 401);
    }
    const expectedToken = await userSesionTknService.getToken(sessionEmail);
    if (sessionToken !== expectedToken || !expectedToken) {
      return jsonResponse({
        success: false,
        error: 'Forbidden',
        message: 'Invalid session token.',
      }, 403);
    }

    /***
    const session = await sessionService.getSession(sessionEmail);
    if (!session) {
      return jsonResponse({
        success: false,
        error: 'Forbidden',
        message: 'Session not found or expired.',
      }, 403);
    } 
    */
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

  // Mount google auth log router
  if (path.startsWith('/googleAuthLog')) {
    const router = makeGoogleAuthLogRouter(env);
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
