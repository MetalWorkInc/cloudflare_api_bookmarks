/**
 * Entry point for Cloudflare Worker - delegates to resource routers
 */
import {
  makeBookmarksRouter,
  makeCalendarsRouter,
  makeContableRouter,
  makeCurriculumVitaeRouter,
  makeGoogleAuthLogRouter,
  makePartnersEnvRouter,
  makeUserSesionRouter,
} from './routes';
import makeUserSesionTknService from './app/services/userSesionTknService';
import { jsonResponse } from './lib/utils.js';

const HEADER_API_TOKEN = 'X-API-Token';
const HEADER_SESSION_TOKEN = 'X-Session-Token';
const HEADER_CONTENT_TYPE = 'Content-Type';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const CORS_ALLOW_ORIGIN = '*';
const CORS_ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS = `${HEADER_CONTENT_TYPE}, ${HEADER_API_TOKEN}, ${HEADER_SESSION_TOKEN}`;

const DEFAULT_API_TOKEN = 'x-api-token-value';

const ERR_UNAUTHORIZED = 'Unauthorized';
const ERR_FORBIDDEN = 'Forbidden';
const ERR_NOT_FOUND = 'Not found';
const ERR_INTERNAL_SERVER = 'Internal server error';

const MSG_API_TOKEN_REQUIRED = `API token is required.`;
const MSG_INVALID_API_TOKEN = 'Invalid API token.';
const MSG_SESSION_REQUIRED = `Session is required.`;
const MSG_INVALID_SESSION_TOKEN = 'Invalid session token.';

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
        'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
        'Access-Control-Allow-Methods': CORS_ALLOW_METHODS,
        'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
      },
    });
  }

  // Validate API Token (skip for GET on root endpoint)
  const tokenApi = request.headers.get(HEADER_API_TOKEN);
  const validTokenApi = env.API_TOKEN || DEFAULT_API_TOKEN;
  
  if (!tokenApi) {
    return jsonResponse({
      success: false,
      error: ERR_UNAUTHORIZED,
      message: MSG_API_TOKEN_REQUIRED,
    }, HTTP_STATUS_UNAUTHORIZED);
  }
  
  if (validTokenApi !== tokenApi) {
    return jsonResponse({
      success: false,
      error: ERR_FORBIDDEN,
      message: MSG_INVALID_API_TOKEN,
    }, HTTP_STATUS_FORBIDDEN);
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
    || path.startsWith('/googleAuthLog')
    || path.startsWith('/calendars')
    || path.startsWith('/contable')) {
  
    const sessionToken = request.headers.get(HEADER_SESSION_TOKEN);    

    if (!sessionToken) {
      return jsonResponse({
        success: false,
        error: ERR_UNAUTHORIZED,
        message: MSG_SESSION_REQUIRED,
      }, HTTP_STATUS_UNAUTHORIZED);
    }
    
    const sessionEmail = await userSesionTknService.getEmail(sessionToken);
    if (!sessionEmail) {
      return jsonResponse({
        success: false,
        error: ERR_FORBIDDEN,
        message: MSG_INVALID_SESSION_TOKEN,
      }, HTTP_STATUS_FORBIDDEN);
    }

    const expectedToken = await userSesionTknService.getToken(sessionEmail);
    if (sessionToken !== expectedToken || !expectedToken) {
      return jsonResponse({
        success: false,
        error: ERR_FORBIDDEN,
        message: MSG_INVALID_SESSION_TOKEN,
      }, HTTP_STATUS_FORBIDDEN);
    }

    const session = await userSesionTknService.getSessionByToken(sessionToken);
    if (!session ) {
      return jsonResponse({
        success: false,
        error: ERR_FORBIDDEN,
        message: MSG_INVALID_SESSION_TOKEN,
      }, HTTP_STATUS_FORBIDDEN);
    } 

    if (session.expiration_date < Date.now()) {
      return jsonResponse({
        success: false,
        error: ERR_FORBIDDEN,
        message: MSG_INVALID_SESSION_TOKEN,
      }, HTTP_STATUS_FORBIDDEN);      
    }
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

  // Mount calendars router
  if (path.startsWith('/calendars')) {
    const router = makeCalendarsRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
  }

  // Mount contable router
  if (path.startsWith('/contable')) {
    const router = makeContableRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
  }

  // 404 - Route not found
  return jsonResponse({
    success: false,
    error: ERR_NOT_FOUND,
    message: `Route ${method} ${path} not found`,
  }, HTTP_STATUS_NOT_FOUND);
}

// Main export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: ERR_INTERNAL_SERVER,
        message: error.message,
      }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  },
};
