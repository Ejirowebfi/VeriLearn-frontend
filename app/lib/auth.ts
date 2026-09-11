import crypto from "crypto";

const DEV_SECRET = "verilearn-dev-secret-change-me";

// Resolved lazily (per sign/verify call, not at module load) so a missing
// AUTH_SECRET never breaks `next build` — only actual auth requests fail.
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET environment variable is required in production. Generate one " +
        "with `openssl rand -base64 32` and set it before deploying — without it, " +
        "session tokens would be signed with a secret that's public in this repo."
    );
  }

  return DEV_SECRET;
}

export interface SessionPayload {
  id: number;
  name: string;
  email: string;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
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
