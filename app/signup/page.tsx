"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

function validate(name: string, email: string, password: string) {
  const errors: Record<string, string> = {};
  if (!name.trim()) errors.name = "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const errs = validate(name, email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signup(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setErrors({ form: (err as Error).message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err: boolean) =>
    `mt-1.5 block w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:outline-none focus:ring-1 bg-white/5 ${
      err ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20"
          : "border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.08] focus:ring-indigo-500/30"
    }`;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-xl shadow-indigo-500/30">V</span>
        </div>
        <h1 className="text-center text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Already have one?{" "}
          <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          {errors.form && (
            <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{errors.form}</p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name" className={inputCls(!!errors.name)} placeholder="Jane Smith" />
            {errors.name && <p role="alert" className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" className={inputCls(!!errors.email)} placeholder="you@example.com" />
            {errors.email && <p role="alert" className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" className={inputCls(!!errors.password)} placeholder="At least 8 characters" />
            {errors.password && <p role="alert" className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-xs text-zinc-500">
            By signing up you agree to our{" "}
            <Link href="#" className="text-zinc-400 underline hover:text-white">Terms</Link> &amp;{" "}
            <Link href="#" className="text-zinc-400 underline hover:text-white">Privacy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
