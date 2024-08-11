export enum Method {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export interface Route {
    route: string[],
    callback: (req: Request, params?: any) => Response | Promise<Response> | boolean,
    method?: Method
}

export class Router {
    route: string;
    onError: ((req: Request) => Response) | undefined;
    middleware: ((req: Request, next: any) => Response | Promise<Response>) | undefined;
    routes: Route[];

    constructor(route: string, onError?: (req: Request) => Response) {
        if(!route.endsWith("/")) route = route + "/";
        this.route = route;
        if (onError != undefined) this.onError = onError;
        this.routes = [];
    }

    public get getBaseRoute(): string {
        return this.route;
    }

    public run(req: Request): Response| Promise<Response> |  boolean | undefined {
        let pathname: string = new URL(req.url).pathname;
        pathname = pathname.replace(this.route, "");
        let paths = pathname.split("/");
        if(pathname.endsWith("/")) paths.pop();
        for (let i = 0; i < this.routes.length; i++) {
            const endpoint: Route = this.routes[i];
            const requestMethod: Method = Method[req.method as keyof typeof Method];
            if(endpoint.route[0] == "" && paths.length == 0) return endpoint.callback(req);
            if(paths.length !=  endpoint.route.length && paths[0] != "") continue;
            let isCorrect = true;
            let params: any = {};

            for (let p = 0; p < endpoint.route.length; p++) {
                const path = endpoint.route[p];
                if(path.startsWith(":") && paths[p] != "") {
                    params[path.slice(1)] = paths[p];
                    continue;
                };
                if(path != paths[p]) isCorrect = false;
            }
            if(!isCorrect) continue;
            if (endpoint.method === undefined || endpoint.method === requestMethod) {
                if(this.middleware != undefined) return this.middleware(req, () => endpoint.callback(req, params));
                return endpoint.callback(req, params);
            }
        }
        if (this.onError != undefined) return this.onError(req);
    }

    /*
        Methods
    */

    public use(middleware: (req: Request, next: any) => Response | Promise<Response> ): Router {
        this.middleware = middleware;
        return this;
    }

    public get(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean): Router {
        if(url.startsWith("/")) url = url.slice(1);

        this.routes.push({
            route: url.split("/"),
            callback: callback,
            method: Method.GET
        })

        return this;
    }

    public post(url: string, callback: (req: Request, params?: any) => Response | Promise<Response> | boolean) {
        if(url.startsWith("/")) url = url.slice(1);

        this.routes.push({
            route: url.split("/"),
            callback: callback,
            method: Method.POST
        })

        return this;
    }

    public put(url: string, callback: (req: Request) => Response | Promise<Response> | boolean) {
        if(url.startsWith("/")) url = url.slice(1);

        this.routes.push({
            route: url.split("/"),
            callback: callback,
            method: Method.PUT
        })
        return this;
    }

    public delete(url: string, callback: (req: Request) => Response | Promise<Response> | boolean) {
        if(url.startsWith("/")) url = url.slice(1);

        this.routes.push({
            route: url.split("/"),
            callback: callback,
            method: Method.DELETE
        })
        return this;
    }
}