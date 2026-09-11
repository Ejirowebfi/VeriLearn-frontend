import crypto from "crypto";

// Demo-app secret. In a real deployment this must come from an env var
// (e.g. `process.env.AUTH_SECRET`) so tokens can't be forged by anyone
// who has read the source.
const SECRET = process.env.AUTH_SECRET || "verilearn-dev-secret-change-me";

export interface SessionPayload {
  id: number;
  name: string;
  email: string;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function createToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}
