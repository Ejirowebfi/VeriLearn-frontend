import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createToken } from "../../../lib/auth";
import { createUser } from "../../../lib/users";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  let user;
  try {
    user = createUser(name.trim(), email, password);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }

  const token = createToken({ id: user.id, name: user.name, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ name: user.name, email: user.email });
}
