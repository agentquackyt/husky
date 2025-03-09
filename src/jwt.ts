import crypto from "crypto";
import { Buffer } from "buffer";

// Base64URL encoding function
function base64url_encode(data: string | Buffer): string {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// Base64URL decoding function
function base64URLdecode(str: string): string {
    const base64Encoded = str.replace(/-/g, "+").replace(/_/g, "/");
    const padding = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
    const base64WithPadding = base64Encoded + padding;
    return Buffer.from(base64WithPadding, "base64").toString("utf-8");
}

export const JWT = {
    settings: {
        secret: Bun.env.JWT_SECRET || "secret",
        algorithm: "HS256",
    },

    /** Set a new secret for signing and verification */
    setSecret: (secret: string) => {
        JWT.settings.secret = secret;
    },

    /** Sign a payload to create a JWT */
    sign: (payloadJson: any): string => {
        const header = base64url_encode(
            JSON.stringify({ alg: JWT.settings.algorithm, typ: "JWT" })
        );
        const payload = base64url_encode(JSON.stringify(payloadJson));
        const dataToSign = `${header}.${payload}`;
        const hash = crypto
            .createHmac("SHA256", JWT.settings.secret)
            .update(dataToSign);
        const signature = base64url_encode(hash.digest());
        return `${header}.${payload}.${signature}`;
    },

    /** Verify the integrity of a JWT */
    verify: (token: string): boolean => {
        const [header, payload, signature] = token.split(".");
        const dataToSign = `${header}.${payload}`;
        const hash = crypto
            .createHmac("SHA256", JWT.settings.secret)
            .update(dataToSign);
        const expectedSignature = base64url_encode(hash.digest());
        return signature === expectedSignature;
    },

    /** Extract the payload from a JWT */
    payloadFromToken: (token: string): any => {
        try {
            const payload = token.split(".")[1];
            return JSON.parse(base64URLdecode(payload));
        } catch (error) {
            console.error("Invalid token payload:", error);
            return null;
        }
    },

    /** Verify JWT from request cookies */
    verifyJWT: async (req: Request): Promise<boolean> => {
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return false;

        const cookies = Object.fromEntries(
            cookieHeader.split(";").map((cookie) => {
                const [key, value] = cookie.split("=");
                return [key.trim(), value];
            })
        );
        const token = cookies["token"];
        if (!token) return false;

        return JWT.verify(token);
    },

    /** Middleware to protect routes */
    middleware:
        (redirectPath: string) =>
        async (req: Request, next: () => any): Promise<Response | any> => {
            const isValid = await JWT.verifyJWT(req);
            if (!isValid) {
                return new Response(null, {
                    status: 302,
                    headers: { Location: redirectPath },
                });
            }
            return next();
        },
};

/** Utility function to hash data to SHA256 in hex */
export function SHA256_to_HEX(data: string): string {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(data);
    return hasher.digest("hex");
}