export enum Method {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export interface Route {
    route: string[];
    callback: (req: Request, params?: any) => Response | Promise<Response> | boolean;
    method?: Method;
}

/**
 * The Router class for creating routes, optimized for performance.
 * @class Router
 * @param {string} route - The base route (e.g., "/api")
 * @param {Function} [onError] - Optional error handler
 * @example
 * const router = new Router("/api")
 *     .get("/", (req) => new Response("Hello World"))
 *     .get("/users/:id", (req, params) => new Response(`User ${params.id}`));
 * husky.use(router);
 */
export class Router {
    route: string;
    onError: ((req: Request) => Response) | undefined;
    middleware: ((req: Request, next: () => Response | Promise<Response> | boolean) => Response | Promise<Response>) | undefined;
    routes: Route[];
    private staticRoutes: {
        [key in Method]: Map<string, (req: Request, params?: any) => Response | Promise<Response> | boolean>
    };

    constructor(route: string, onError?: (req: Request) => Response) {
        if (!route.endsWith("/")) route += "/";
        this.route = route;
        this.onError = onError;
        this.routes = []; // For dynamic routes only
        this.staticRoutes = {
            [Method.GET]: new Map(),
            [Method.POST]: new Map(),
            [Method.PUT]: new Map(),
            [Method.DELETE]: new Map()
        };
    }

    public get getBaseRoute(): string {
        return this.route;
    }

    public run(req: Request): Response | Promise<Response> | boolean | undefined {
        let pathname = new URL(req.url).pathname;
        pathname = pathname.replace(this.route, "");
        const paths = pathname.split("/").filter(segment => segment !== "");
        
        const requestMethod = Method[req.method as keyof typeof Method];
        const staticMap = this.staticRoutes[requestMethod];
        if (staticMap) {
            const key = paths.join("/") || ""; // Empty array becomes "" for root
            const callback = staticMap.get(key);
            if (callback) {
                return this.middleware ? this.middleware(req, () => callback(req)) : callback(req);
            }
        }

        // Check dynamic routes
        for (let i = 0; i < this.routes.length; i++) {
            const endpoint = this.routes[i];
            if (endpoint.route.length !== paths.length) continue;
            let isCorrect = true;
            let params: Record<string, string> = {};
            for (let p = 0; p < endpoint.route.length; p++) {
                const routeSegment = endpoint.route[p];
                if (routeSegment.startsWith(":")) {
                    params[routeSegment.slice(1)] = paths[p];
                } else if (routeSegment !== paths[p]) {
                    isCorrect = false;
                    break;
                }
            }
            if (isCorrect && (endpoint.method === undefined || endpoint.method === requestMethod)) {
                return this.middleware ? this.middleware(req, () => endpoint.callback(req, params)) : endpoint.callback(req, params);
            }
        }

        return this.onError?.(req);
    }

    /*
        Methods
    */

    public use(middleware: (req: Request, next: () => Response | Promise<Response> | boolean) => Response | Promise<Response>): Router {
        this.middleware = middleware;
        return this;
    }

    public get(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean): Router {
        if (url.startsWith("/")) url = url.slice(1);
        const segments = url.split("/").filter(segment => segment !== "");
        const isStatic = segments.every(segment => !segment.startsWith(":"));
        if (isStatic) {
            const key = segments.join("/") || ""; // Root "/" becomes ""
            this.staticRoutes[Method.GET].set(key, callback);
        } else {
            this.routes.push({ route: segments, callback, method: Method.GET });
        }
        return this;
    }

    public post(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean): Router {
        if (url.startsWith("/")) url = url.slice(1);
        const segments = url.split("/").filter(segment => segment !== "");
        const isStatic = segments.every(segment => !segment.startsWith(":"));
        if (isStatic) {
            const key = segments.join("/") || "";
            this.staticRoutes[Method.POST].set(key, callback);
        } else {
            this.routes.push({ route: segments, callback, method: Method.POST });
        }
        return this;
    }

    public put(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean): Router {
        if (url.startsWith("/")) url = url.slice(1);
        const segments = url.split("/").filter(segment => segment !== "");
        const isStatic = segments.every(segment => !segment.startsWith(":"));
        if (isStatic) {
            const key = segments.join("/") || "";
            this.staticRoutes[Method.PUT].set(key, callback);
        } else {
            this.routes.push({ route: segments, callback, method: Method.PUT });
        }
        return this;
    }

    public delete(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean): Router {
        if (url.startsWith("/")) url = url.slice(1);
        const segments = url.split("/").filter(segment => segment !== "");
        const isStatic = segments.every(segment => !segment.startsWith(":"));
        if (isStatic) {
            const key = segments.join("/") || "";
            this.staticRoutes[Method.DELETE].set(key, callback);
        } else {
            this.routes.push({ route: segments, callback, method: Method.DELETE });
        }
        return this;
    }
}