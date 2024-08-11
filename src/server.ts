import { Router } from "./route";
import { Output } from "./logging";

export type HuskyConfig = {
  port?: string | number;
  httpsConfig?: TLSConfig[];
  logging?: {
    allowHTTP: boolean;
    allowWS: boolean;
    allowError: boolean;
    allowInfo: boolean;
  };
}

export type TLSConfig = {
  serverName: string;
  key: string;
  cert: string;
  passphrase?: string;
  ca?: string;
}

export class Husky {
  routerList: Router[];
  port: string | number;
  server: import("bun").Server | undefined;
  tlsConfig: TLSConfig[] | undefined;

  constructor(config?: HuskyConfig) {
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

  use(router: Router): void {
    this.routerList.push(router);
  }

  start({ port, callback }: { port?: number; callback?: (port: number) => void; } = {}): import("bun").Server {
    this.server = Bun.serve({
      port: port || this.port,
      fetch: this.handleRequest,
      tls: this.tlsConfig || undefined,
    });

    if (callback !== undefined) callback(this.server.port);
    return this.server;
  }

  handleRequest(req: Request): Response | Promise<Response> {
    Output.http(req);
    const url = new URL(req.url).pathname;
    for (const router of this.routerList) {
      if (url.startsWith(router.getBaseRoute) || url.startsWith(router.getBaseRoute.slice(0, -1))) {
        const routerCallback = router.run(req) as Response | Promise<Response> | undefined;
        // If the router returns a response, return it
        if (routerCallback !== undefined) return routerCallback;
      }
    }
    Output.error("Fallback to default 404");
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
}