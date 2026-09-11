import crypto from "crypto";

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString("hex")): string {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedDerived] = passwordHash.split(":");
  if (!salt || !storedDerived) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedDerived, "hex");
  return derived.length === stored.length && crypto.timingSafeEqual(derived, stored);
}

// In-memory user store. Resets on every server restart / cold start — there is
// no database behind this demo app. This is a known limitation, not a bug:
// on a long-running Node process (local dev, `next start`, Docker, this repo's
// own CI) newly signed-up accounts work for the lifetime of that process.
const users: StoredUser[] = [
  { id: 1, name: "Alice", email: "alice@example.com", passwordHash: hashPassword("password123") },
  { id: 2, name: "Bob", email: "bob@example.com", passwordHash: hashPassword("password123") },
  { id: 3, name: "Test User", email: "test@example.com", passwordHash: hashPassword("password123") },
];

let nextId = users.length + 1;

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function checkPassword(user: StoredUser, password: string): boolean {
  return verifyPassword(password, user.passwordHash);
}

export function createUser(name: string, email: string, password: string): StoredUser {
  if (findUserByEmail(email)) {
    throw new Error("An account with that email already exists.");
  }
  const user: StoredUser = { id: nextId++, name, email, passwordHash: hashPassword(password) };
  users.push(user);
  return user;
}
