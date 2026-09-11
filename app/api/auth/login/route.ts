import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createToken } from "../../../lib/auth";
import { checkPassword, findUserByEmail } from "../../../lib/users";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = typeof email === "string" ? findUserByEmail(email) : undefined;
  if (!user || typeof password !== "string" || !checkPassword(user, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
