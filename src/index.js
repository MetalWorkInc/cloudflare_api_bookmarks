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
  makePartnerRequestRouter,
  makeUserSesionRouter,
} from './routes';
import makeUserSesionTknService from './app/services/auth/userSesionTknService';
import { jsonResponse, HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_FOUND, HTTP_STATUS_INTERNAL_SERVER_ERROR } from './lib/utils.js';

const HEADER_API_TOKEN = 'X-API-Token';
const HEADER_API_TOKEN_VALUE = 'x-api-token-value';
const HEADER_API_VAR = 'X-API-VAR';
const HEADER_API_VAR_VALUE = 'var-value';
const HEADER_SESSION_TOKEN = 'X-Session-Token';
const HEADER_CONTENT_TYPE = 'Content-Type';

const CORS_ALLOW_ORIGIN = '*';
const CORS_ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS = `${HEADER_CONTENT_TYPE}, ${HEADER_API_TOKEN}, ${HEADER_SESSION_TOKEN}, ${HEADER_API_VAR}`;

const ERR_UNAUTHORIZED = 'Unauthorized';
const ERR_FORBIDDEN = 'Forbidden';
const ERR_NOT_FOUND = 'Not found';
const ERR_INTERNAL_SERVER = 'Internal server error';

const MSG_API_TOKEN_REQUIRED = `API token is required.`;
const MSG_API_VAR_REQUIRED = 'API var is required.';
const MSG_INVALID_API_TOKEN = 'Invalid API token.';
const MSG_SESSION_REQUIRED = `Session is required.`;
const MSG_INVALID_SESSION_TOKEN = 'Invalid session token.';

const FAVICON_PATH = '/favicon.ico';
const FAVICON_REDIRECT_URL = 'https://droguier.cl/assets/icons/fav_icon.png';

const ROUTE_DEFINITIONS = [
  //public routes that do not require session validation
  { prefix: '/curriculum', makeRouter: makeCurriculumVitaeRouter, requiresSession: false },
  { prefix: '/session', makeRouter: makeUserSesionRouter, requiresSession: false },
  { prefix: '/partner-request', makeRouter: makePartnerRequestRouter, requiresSession: false },
  //private routes that require session validation
  { prefix: '/bookmarks', makeRouter: makeBookmarksRouter, requiresSession: true },
  { prefix: '/partners', makeRouter: makePartnersEnvRouter, requiresSession: true },
  { prefix: '/calendars', makeRouter: makeCalendarsRouter, requiresSession: true },
  { prefix: '/contable', makeRouter: makeContableRouter, requiresSession: true },
  { prefix: '/googleLog', makeRouter: makeGoogleAuthLogRouter, requiresSession: true },
];

/******************************************************************************/
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

/******************************************************************************/
// Router to handle different routes (delegates to modules)
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: getCorsHeaders(),
    });
  }
  
  // Handle Root
  const rootResponse = handleRootRoute(path, method);
  if (rootResponse) {
    return rootResponse;
  }
  
  // Serve favicon via redirect without requiring API headers.
  if ((method === 'GET' || method === 'HEAD') && path === FAVICON_PATH) {
    return Response.redirect(FAVICON_REDIRECT_URL, HTTP_STATUS_FOUND);
  }

  // Handle Api Token and Session Validation
  const apiTokenValidationError = validateApiToken(request, env);
  if (apiTokenValidationError) {
    return apiTokenValidationError;
  }

  // Handle Api Var Validation (optional)
  validateApiVar(request, env, method, path);
  
  // Handle Session Validation for routes that require it
  // Initialize route config and dispatch to the appropriate router
  const routeConfig = findRouteConfig(path);
  // Initialize services
  const userSesionTknService = makeUserSesionTknService(env);

  if (routeConfig && routeConfig.requiresSession) {
    const sessionValidationError = await validateSession(request, userSesionTknService);
    if (sessionValidationError) {
      return sessionValidationError;
    }
  }

  // Dispatch to the appropriate router based on the route config
  const routeResponse = await dispatchRoute(request, path, method, env, routeConfig);
  if (routeResponse) {
    return routeResponse;
  }

  // 404 - Route not found
  return jsonResponse({
    success: false,
    error: ERR_NOT_FOUND,
    message: `Route ${method} ${path} not found`,
  }, HTTP_STATUS_NOT_FOUND);
}


/******************************************************************************/
/******************************************************************************/
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': CORS_ALLOW_METHODS,
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
  };
}

function handleRootRoute(path, method) {
  if (path !== '/' || method !== 'GET') {
    return null;
  }

  return jsonResponse({
    name: 'Cloudflare Statics API',
    version: '1.0.2',
    contact: 'droguier@gmail.com',
    endpoints: {
      'GET /': 'Get info',
    },
  });
}

function findRouteConfig(path) {
  return ROUTE_DEFINITIONS.find((route) => path.startsWith(route.prefix));
}

function validateApiToken(request, env) {
  const tokenApi = request.headers.get(HEADER_API_TOKEN);
  const validTokenApi = env.API_TOKEN || HEADER_API_TOKEN_VALUE;

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

  return null;
}

function validateApiVar(request, env, method, path) {
  const varApi = request.headers.get(HEADER_API_VAR);
  const validApiVar = env.WORKER_VAR_X || HEADER_API_VAR_VALUE;

  if (!varApi) {
    console.info(`[API_VAR][missing] ${method} ${path}`);
    return;
  }

  if (varApi !== validApiVar) {
    console.info(`[API_VAR][invalid] ${method} ${path}`);
    return;
  }

  console.info(`[API_VAR][present] ${method} ${path}`);
}

async function validateSession(request, userSesionTknService) {
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
  if (!session) {
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

  return null;
}

async function dispatchRoute(request, path, method, env, routeConfig) {
  if (!routeConfig) {
    return null;
  }

  const router = routeConfig.makeRouter(env);
  return router(request, path, method);
}
