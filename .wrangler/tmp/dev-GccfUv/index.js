var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Rco71T/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/lib/utils.js
function generateId2() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
__name(generateId2, "generateId");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(jsonResponse, "jsonResponse");

// src/services/bookmarksService.js
function makeBookmarksService(env) {
  const kv = env.BOOKMARKS_KV;
  async function list() {
    const list2 = await kv.list();
    const bookmarks = [];
    for (const key of list2.keys) {
      const bookmark = await kv.get(key.name, { type: "json" });
      if (bookmark) bookmarks.push(bookmark);
    }
    return bookmarks;
  }
  __name(list, "list");
  async function getById(id) {
    return await kv.get(id, { type: "json" });
  }
  __name(getById, "getById");
  async function create(data) {
    const id = generateId2();
    const bookmark = {
      id,
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description ? data.description.trim() : "",
      tags: data.tags || [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await kv.put(id, JSON.stringify(bookmark));
    return bookmark;
  }
  __name(create, "create");
  async function update(id, data) {
    const existing = await getById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description ? data.description.trim() : "",
      tags: data.tags || [],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await kv.put(id, JSON.stringify(updated));
    return updated;
  }
  __name(update, "update");
  async function remove(id) {
    const existing = await getById(id);
    if (!existing) return null;
    await kv.delete(id);
    return existing;
  }
  __name(remove, "remove");
  return { list, getById, create, update, remove };
}
__name(makeBookmarksService, "makeBookmarksService");

// src/models/bookmark.js
function validateBookmark2(data) {
  const errors = [];
  console.log("Validating bookmark data:", data);
  if (!data || typeof data !== "object") {
    errors.push("Invalid payload");
    return errors;
  }
  if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
    errors.push("Title is required and must be a non-empty string");
  }
  if (!data.url || typeof data.url !== "string" || data.url.trim() === "") {
    errors.push("URL is required and must be a non-empty string");
  } else {
    try {
      new URL(data.url);
    } catch (e) {
      errors.push("URL must be a valid URL");
    }
  }
  return errors;
}
__name(validateBookmark2, "validateBookmark");

// src/controllers/bookmarksController.js
function makeBookmarksController(service) {
  async function list(req, env) {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      return jsonResponse({ success: false, error: "Failed to retrieve bookmarks", message: err.message }, 500);
    }
  }
  __name(list, "list");
  async function get(req, env, id) {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: "Bookmark not found" }, 404);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      return jsonResponse({ success: false, error: "Failed to retrieve bookmark", message: err.message }, 500);
    }
  }
  __name(get, "get");
  async function create(req, env) {
    try {
      const data = await req.json();
      const errors = validateBookmark2(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const created = await service.create(data);
      return jsonResponse({ success: true, data: created, message: "Bookmark created successfully" }, 201);
    } catch (err) {
      return jsonResponse({ success: false, error: "Failed to create bookmark", message: err.message }, 500);
    }
  }
  __name(create, "create");
  async function update(req, env, id) {
    try {
      const exists = await service.getById(id);
      if (!exists) return jsonResponse({ success: false, error: "Bookmark not found" }, 404);
      const data = await req.json();
      const errors = validateBookmark2(data);
      if (errors.length) return jsonResponse({ success: false, errors }, 400);
      const updated = await service.update(id, data);
      return jsonResponse({ success: true, data: updated, message: "Bookmark updated successfully" });
    } catch (err) {
      return jsonResponse({ success: false, error: "Failed to update bookmark", message: err.message }, 500);
    }
  }
  __name(update, "update");
  async function remove(req, env, id) {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: "Bookmark not found" }, 404);
      return jsonResponse({ success: true, message: "Bookmark deleted successfully", data: deleted });
    } catch (err) {
      return jsonResponse({ success: false, error: "Failed to delete bookmark", message: err.message }, 500);
    }
  }
  __name(remove, "remove");
  return { list, get, create, update, remove };
}
__name(makeBookmarksController, "makeBookmarksController");

// src/routes/bookmarks.js
function makeBookmarksRouter(env) {
  const service = makeBookmarksService(env);
  const controller = makeBookmarksController(service);
  return /* @__PURE__ */ __name(async function route(request, path, method) {
    const idMatch = path.match(/^\/bookmarks(?:\/([^\/]+))?$/);
    const id = idMatch ? idMatch[1] : null;
    if (path === "/bookmarks" && method === "GET") return controller.list(request, env);
    if (path === "/bookmarks" && method === "POST") return controller.create(request, env);
    if (id && method === "GET") return controller.get(request, env, id);
    if (id && method === "PUT") return controller.update(request, env, id);
    if (id && method === "DELETE") return controller.remove(request, env, id);
    return null;
  }, "route");
}
__name(makeBookmarksRouter, "makeBookmarksRouter");

// src/index.js
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (path.startsWith("/bookmarks")) {
    const router = makeBookmarksRouter(env);
    const res = await router(request, path, method);
    if (res) return res;
  }
  if (path === "/" && method === "GET") {
    return jsonResponse({
      name: "Cloudflare Bookmarks API",
      version: "1.0.0",
      endpoints: {
        "GET /bookmarks": "Get all bookmarks",
        "GET /bookmarks/:id": "Get bookmark by ID",
        "POST /bookmarks": "Create new bookmark",
        "PUT /bookmarks/:id": "Update bookmark",
        "DELETE /bookmarks/:id": "Delete bookmark"
      }
    });
  }
  return jsonResponse({
    success: false,
    error: "Not found",
    message: `Route ${method} ${path} not found`
  }, 404);
}
__name(handleRequest, "handleRequest");
var src_default = {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: "Internal server error",
        message: error.message
      }, 500);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Rco71T/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Rco71T/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
