function base64url_encode(buffer: string) {
    return btoa(buffer)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64URLdecode(str: string) {
    const base64Encoded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const base64WithPadding = base64Encoded + padding;
    return atob(base64WithPadding);
  }

export const JWT = {
    settings: {
        secret: Bun.env.JWT_SECRET || "secret",
        algorithm: "sha256"
    },
    sign: (payloadJson: any) => {
        let header = base64url_encode(JSON.stringify({ alg: JWT.settings.algorithm, typ: "JWT" }));
        let payload = base64url_encode(JSON.stringify(payloadJson));
       
        const hasher = new Bun.CryptoHasher("sha256");
        hasher.update(header+"."+payload);
        hasher.update(JWT.settings.secret);
        let signature = base64url_encode(hasher.digest("base64"));

        return `${header}.${payload}.${signature}`;
    },
    verify: (token: string) => {
        let [header, payload, signature] = token.split(".");
        let hasher = new Bun.CryptoHasher("sha256");
        hasher.update(header+"."+payload);
        hasher.update(JWT.settings.secret);
        let expectedSignature = base64url_encode(hasher.digest("base64"));
        return signature === expectedSignature;
    },
    payloadFromToken: (token: string) => {
        let payload = token.split(".")[1];
        return JSON.parse(base64URLdecode(payload));
    },
    verifyJWT: async (req: Request): Promise<boolean> => {
        const cookies = {};
        req.headers.get("cookie")?.split(";").forEach((cookie: string) => {
            let [key, value] = cookie.split("=");
            // @ts-expect-error
            cookies[key.trim()] = value;
        });
            // @ts-expect-error
        if(cookies["token"] == undefined) return false;
            // @ts-expect-error

        return JWT.verify(cookies["token"]);
    },
    middleware: (redirectPath: string) => async (req: Request, next: () => any) => {
        let response = await JWT.verifyJWT(req);
        if(response == false) return Response.redirect(redirectPath);
        return next();
    }
}

export function SHA256_to_HEX(data: string): string {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(data);
    return hasher.digest("hex");
}