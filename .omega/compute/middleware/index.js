// ../../../../../nextjs-test-app/.omega/compute/middleware/_entrypoint.mjs
import middleware from "./middleware.mjs";

// src/runtime/middleware-adapter.ts
function detectResponseType(response) {
  const status = response.status;
  const hasLocation = response.headers.has("Location");
  if (hasLocation && status >= 300 && status < 400) {
    return "redirect";
  }
  if (response.headers.has("x-middleware-rewrite")) {
    return "rewrite";
  }
  if (response.headers.get("x-middleware-next") === "1") {
    return "next";
  }
  return "earlyResponse";
}
function translateRedirect(response) {
  const headers = new Headers();
  headers.set("x-omega-middleware-result", "earlyResponse");
  const location = response.headers.get("Location");
  if (location) {
    headers.set("Location", location);
  }
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "location" && !lower.startsWith("x-middleware-")) {
      headers.set(key, value);
    }
  });
  return { status: response.status, headers };
}
function translateRewrite(response) {
  const headers = new Headers();
  headers.set("x-omega-middleware-result", "modifiedRequest");
  const rewriteUrl = response.headers.get("x-middleware-rewrite");
  if (rewriteUrl) {
    const parsed = new URL(rewriteUrl, "http://localhost");
    const uri = parsed.pathname + parsed.search;
    headers.set("x-omega-middleware-req-uri", uri);
  }
  const reqHeaders = extractRequestHeaderOps(response);
  const resHeaders = extractResponseHeaderOps(response);
  const cookieOps = extractCookieOps(response);
  const headerOps = encodeHeaderOperations(reqHeaders, resHeaders, cookieOps);
  headerOps.forEach((value, key) => headers.set(key, value));
  return { status: 200, headers };
}
function encodeHeaderOperations(reqHeaders, resHeaders, cookieOps = []) {
  const headers = new Headers();
  let seq = 0;
  for (const [key, { op, value }] of reqHeaders) {
    headers.set(`x-omega-middleware-req-header-${seq}-${op}-${key}`, value);
    seq++;
  }
  for (const [key, { op, value }] of resHeaders) {
    headers.set(`x-omega-middleware-res-header-${seq}-${op}-${key}`, value);
    seq++;
  }
  for (const { value } of cookieOps) {
    headers.set(
      `x-omega-middleware-res-header-${seq}-append-Set-Cookie`,
      value
    );
    seq++;
  }
  return headers;
}
function extractRequestHeaderOps(response) {
  const reqHeaders = /* @__PURE__ */ new Map();
  const overrideHeadersRaw = response.headers.get(
    "x-middleware-override-headers"
  );
  if (!overrideHeadersRaw) return reqHeaders;
  const overriddenNames = overrideHeadersRaw.split(",").map((h) => h.trim().toLowerCase()).filter((h) => h.length > 0);
  for (const name of overriddenNames) {
    const value = response.headers.get(`x-middleware-request-${name}`);
    if (value !== null) {
      reqHeaders.set(name, { op: "append", value });
    } else {
      reqHeaders.set(name, { op: "remove", value: "" });
    }
  }
  return reqHeaders;
}
function extractResponseHeaderOps(response) {
  const resHeaders = /* @__PURE__ */ new Map();
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-middleware-")) return;
    if (lower === "set-cookie") return;
    resHeaders.set(key, { op: "append", value });
  });
  return resHeaders;
}
function extractCookieOps(response) {
  const cookies = [];
  if (typeof response.headers.getSetCookie === "function") {
    for (const cookie of response.headers.getSetCookie()) {
      if (cookie) {
        cookies.push({ op: "append", value: cookie });
      }
    }
  } else {
    const raw = response.headers.get("set-cookie");
    if (raw) {
      for (const cookie of raw.split(/,(?=\s*\w+=)/)) {
        cookies.push({ op: "append", value: cookie.trim() });
      }
    }
  }
  return cookies;
}
function buildEarlyResponse(status, responseHeaders) {
  const headers = new Headers(responseHeaders);
  headers.set("x-omega-middleware-result", "earlyResponse");
  return new Response(null, { status, headers });
}
function translateNext(response) {
  const reqHeaders = extractRequestHeaderOps(response);
  const resHeaders = extractResponseHeaderOps(response);
  const cookieOps = extractCookieOps(response);
  const hasModifications = reqHeaders.size > 0 || resHeaders.size > 0 || cookieOps.length > 0;
  if (!hasModifications) {
    const headers2 = new Headers();
    headers2.set("x-omega-middleware-result", "unmodifiedRequest");
    return { status: 200, headers: headers2 };
  }
  const headers = encodeHeaderOperations(reqHeaders, resHeaders, cookieOps);
  headers.set("x-omega-middleware-result", "modifiedRequest");
  return { status: 200, headers };
}
function createHandler(middleware2) {
  return async (request) => {
    try {
      const nextRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers
      });
      const response = await middleware2(nextRequest);
      if (response == null) {
        return new Response(null, {
          status: 200,
          headers: { "x-omega-middleware-result": "unmodifiedRequest" }
        });
      }
      const responseType = detectResponseType(response);
      switch (responseType) {
        case "redirect": {
          const result = translateRedirect(response);
          return new Response(null, result);
        }
        case "rewrite": {
          const result = translateRewrite(response);
          return new Response(null, result);
        }
        case "next": {
          const result = translateNext(response);
          return new Response(null, result);
        }
        case "earlyResponse": {
          return buildEarlyResponse(response.status, response.headers);
        }
      }
    } catch (err) {
      console.error("[middleware-adapter] Middleware execution failed:", err);
      return buildEarlyResponse(500);
    }
  };
}

// ../../../../../nextjs-test-app/.omega/compute/middleware/_entrypoint.mjs
var entrypoint_default = createHandler(middleware);
export {
  entrypoint_default as default
};
