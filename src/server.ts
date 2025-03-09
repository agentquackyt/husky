import { Router } from "./route";
import { Output } from "./logging";

/**
 * Husky configuration
 * @typedef {Object} HuskyConfig
 * @property {string | number} [port] - The port to listen on (optional)
 * @property {TLSConfig[]} [httpsConfig] - The TLS configuration (optional)
 * @property {Object} [logging] - The logging configuration (optional)
 */
export type HuskyConfig = {
  port?: string | number;
  httpsConfig?: TLSConfig[];
  logging?: {
    allowHTTP: boolean;
    allowWS: boolean;
    allowError: boolean;
    allowInfo: boolean;
  };
};

/**
 * TLS configuration
 * @typedef {Object} TLSConfig
 * @property {string} serverName - The server name
 * @property {string} key - The key
 * @property {string} cert - The certificate
 * @property {string} [passphrase] - The passphrase (optional)
 * @property {string} [ca] - The CA (optional)
 */
export type TLSConfig = {
  serverName: string;
  key: string;
  cert: string;
  passphrase?: string;
  ca?: string;
};

/**
 * The main Husky class for creating a server
 * @class Husky
 * @param {HuskyConfig} [config] - The Husky configuration (optional)
 */
export class Husky {
  private routerList: Router[];
  private port: string | number;
  public server: import("bun").Server | undefined;
  private tlsConfig: TLSConfig[] | undefined;

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

  /** Adds a router and sorts the list by base route length (descending) */
  use(router: Router): void {
    this.routerList.push(router);
    // Sort routers by base route length (longest first) for specific matching
    this.routerList.sort((a, b) => 
      b.getBaseRoute.length - a.getBaseRoute.length
    );
  }

  /** Starts the server and returns the server instance */
  start({ port, callback }: { port?: number; callback?: (port: number) => void } = {}): import("bun").Server {
    this.server = Bun.serve({
      port: port || this.port,
      fetch: this.handleRequest,
      tls: this.tlsConfig || undefined,
    });

    if (callback !== undefined) callback(this.server.port);
    return this.server;
  }

  /** Handles incoming requests by finding the first matching router */
  handleRequest(req: Request): Response | Promise<Response> {
    Output.http(req);
    const url = new URL(req.url).pathname;
    for (const router of this.routerList) {
      // Assume baseRoute ends with "/" from Router class
      if (url.startsWith(router.getBaseRoute)) {
        const routerCallback = router.run(req) as Response | Promise<Response> | undefined;
        if (routerCallback !== undefined) return routerCallback;
      }
    }
    Output.error("Fallback to default 404");
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  /** Retrieves the server instance, throwing an error if not started */
  public getServer(): import("bun").Server {
    if (this.server === undefined) {
      throw new Error("Server has not been started yet.");
    }
    return this.server;
  }
}