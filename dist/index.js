// src/logging.ts
var development = {
  allowHTTP: true,
  allowWS: true,
  allowError: true,
  allowInfo: true
};
var Output = {
  http: (req) => {
    if (development.allowHTTP == true)
      console.log(Color.yellow + req.method + Color.reset + " " + req.url);
  },
  error: (message) => {
    if (development.allowError)
      console.log(Color.bold + Color.red + "ERROR: " + Color.reset + message);
  },
  info: (message) => {
    if (development.allowInfo)
      console.log(Color.bold + Color.blue + "[info] " + Color.reset + message);
  },
  ws: (message) => {
    if (development.allowWS)
      console.log(Color.bold + Color.green + "WS " + Color.reset + message);
  },
  validation: (message) => {
    if (development.allowHTTP)
      console.log(Color.bold + Color.magenta + "[Validation] " + Color.reset + message);
  },
  debug: (message) => {
    if (!development)
      return;
    console.log(Color.bold + Color.magenta + "[debug] " + Color.reset);
    Object.keys(message).forEach((key) => {
      console.log(key + ": " + JSON.stringify(message[key]));
    });
  },
  center: (message, dotted = false) => {
    let lineLength = 70;
    let center = Math.floor((lineLength - message.length) / 2);
    let line = "";
    for (let i = 0;i < center; i++) {
      line += dotted ? "-" : " ";
    }
    console.log(line + message + line);
  },
  printProgress: (progress) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(progress + "%");
  },
  config: (config) => {
    development = config;
  }
};
var Color = {
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  reset: "\x1B[0m",
  red_bg: "\x1B[41m",
  green_bg: "\x1B[42m",
  yellow_bg: "\x1B[43m",
  blue_bg: "\x1B[44m",
  magenta_bg: "\x1B[45m",
  cyan_bg: "\x1B[46m",
  white_bg: "\x1B[47m",
  bold: "\x1B[1m",
  underline: "\x1B[4m",
  inverse: "\x1B[7m",
  hidden: "\x1B[8m",
  strikethrough: "\x1B[9m"
};

// src/server.ts
class Husky {
  routerList;
  port;
  server;
  tlsConfig;
  constructor(config) {
    this.routerList = [];
    this.handleRequest = this.handleRequest.bind(this);
    if (config !== undefined) {
      this.port = config.port !== undefined ? config.port : Bun.env.PORT || 0;
      if (config.logging !== undefined) {
        Output.config(config.logging);
      }
      if (config.httpsConfig !== undefined) {
        this.tlsConfig = config.httpsConfig;
      }
    } else {
      this.port = Bun.env.PORT || 0;
    }
  }
  use(router) {
    this.routerList.push(router);
  }
  start({ port, callback } = {}) {
    this.server = Bun.serve({
      port: port || this.port,
      fetch: this.handleRequest,
      tls: this.tlsConfig || undefined
    });
    if (callback !== undefined)
      callback(this.server.port);
    return this.server;
  }
  handleRequest(req) {
    Output.http(req);
    const url = new URL(req.url).pathname;
    for (const router of this.routerList) {
      if (url.startsWith(router.getBaseRoute) || url.startsWith(router.getBaseRoute.slice(0, -1))) {
        const routerCallback = router.run(req);
        if (routerCallback !== undefined)
          return routerCallback;
      }
    }
    Output.error("Fallback to default 404");
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
}

// src/route.ts
var Method;
((Method2) => {
  Method2["GET"] = "GET";
  Method2["POST"] = "POST";
  Method2["PUT"] = "PUT";
  Method2["DELETE"] = "DELETE";
})(Method ||= {});

class Router {
  route;
  onError;
  middleware;
  routes;
  constructor(route, onError) {
    if (!route.endsWith("/"))
      route = route + "/";
    this.route = route;
    if (onError != null)
      this.onError = onError;
    this.routes = [];
  }
  get getBaseRoute() {
    return this.route;
  }
  run(req) {
    let pathname = new URL(req.url).pathname;
    pathname = pathname.replace(this.route, "");
    let paths = pathname.split("/");
    if (pathname.endsWith("/"))
      paths.pop();
    for (let i = 0;i < this.routes.length; i++) {
      const endpoint = this.routes[i];
      const requestMethod = Method[req.method];
      if (endpoint.route[0] == "" && paths.length == 0)
        return endpoint.callback(req);
      if (paths.length != endpoint.route.length && paths[0] != "")
        continue;
      let isCorrect = true;
      let params = {};
      for (let p = 0;p < endpoint.route.length; p++) {
        const path = endpoint.route[p];
        if (path.startsWith(":") && paths[p] != "") {
          params[path.slice(1)] = paths[p];
          continue;
        }
        if (path != paths[p])
          isCorrect = false;
      }
      if (!isCorrect)
        continue;
      if (endpoint.method === undefined || endpoint.method === requestMethod) {
        if (this.middleware != null)
          return this.middleware(req, () => endpoint.callback(req, params));
        return endpoint.callback(req, params);
      }
    }
    if (this.onError != null)
      return this.onError(req);
  }
  use(middleware) {
    this.middleware = middleware;
    return this;
  }
  get(url, callback) {
    if (url.startsWith("/"))
      url = url.slice(1);
    this.routes.push({
      route: url.split("/"),
      callback,
      method: "GET" /* GET */
    });
    return this;
  }
  post(url, callback) {
    if (url.startsWith("/"))
      url = url.slice(1);
    this.routes.push({
      route: url.split("/"),
      callback,
      method: "POST" /* POST */
    });
    return this;
  }
  put(url, callback) {
    if (url.startsWith("/"))
      url = url.slice(1);
    this.routes.push({
      route: url.split("/"),
      callback,
      method: "PUT" /* PUT */
    });
    return this;
  }
  delete(url, callback) {
    if (url.startsWith("/"))
      url = url.slice(1);
    this.routes.push({
      route: url.split("/"),
      callback,
      method: "DELETE" /* DELETE */
    });
    return this;
  }
}

// src/jwt.ts
function base64url_encode(buffer) {
  return btoa(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64URLdecode(str) {
  const base64Encoded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = str.length % 4 === 0 ? "" : "=".repeat(4 - str.length % 4);
  const base64WithPadding = base64Encoded + padding;
  return atob(base64WithPadding);
}
var JWT = {
  settings: {
    secret: Bun.env.JWT_SECRET || "secret",
    algorithm: "sha256"
  },
  sign: (payloadJson) => {
    let header = base64url_encode(JSON.stringify({ alg: JWT.settings.algorithm, typ: "JWT" }));
    let payload = base64url_encode(JSON.stringify(payloadJson));
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(header + "." + payload);
    hasher.update(JWT.settings.secret);
    let signature = base64url_encode(hasher.digest("base64"));
    return `${header}.${payload}.${signature}`;
  },
  verify: (token) => {
    let [header, payload, signature] = token.split(".");
    let hasher = new Bun.CryptoHasher("sha256");
    hasher.update(header + "." + payload);
    hasher.update(JWT.settings.secret);
    let expectedSignature = base64url_encode(hasher.digest("base64"));
    return signature === expectedSignature;
  },
  payloadFromToken: (token) => {
    let payload = token.split(".")[1];
    return JSON.parse(base64URLdecode(payload));
  },
  verifyJWT: async (req) => {
    const cookies = {};
    req.headers.get("cookie")?.split(";").forEach((cookie) => {
      let [key, value] = cookie.split("=");
      cookies[key.trim()] = value;
    });
    if (cookies["token"] == undefined)
      return false;
    return JWT.verify(cookies["token"]);
  },
  middleware: (redirectPath) => async (req, next) => {
    let response = await JWT.verifyJWT(req);
    if (response == false)
      return Response.redirect(redirectPath);
    return next();
  }
};

// src/index.ts
var src_default = {
  Husky,
  Router,
  JWT,
  Console: {
    Output,
    Color
  }
};
export {
  src_default as default
};
