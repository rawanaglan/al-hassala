"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Account created successfully. You can now log in."
      );

      setIsSignUp(false);
      setLoading(false);
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

   setLoading(false);

const params = new URLSearchParams(window.location.search);
const redirectTo = params.get("redirect");

if (redirectTo) {
  router.push(redirectTo);
} else {
  router.push("/library");
}

router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-md">

        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back to home
        </Link>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-950 p-8">

          <h1 className="text-3xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>

          <p className="mt-2 text-gray-400">
            {isSignUp
              ? "Create your Al Hassala account."
              : "Log in to access your library."}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Create Account"
                : "Log In"}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
              }}
              className="ml-2 text-white underline"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
            <form action="/api/guest-login" method="POST">
 <div className="mt-6 space-y-4">
  <div className="relative flex py-2 items-center">
    <div className="flex-grow border-t border-[#d4af37]/30"></div>
    <span className="flex-shrink mx-4 text-xs text-[#8c6d31]">أو</span>
    <div className="flex-grow border-t border-[#d4af37]/30"></div>
  </div>

  {/* Continue as Guest Form */}
  <form action="/api/guest-login" method="POST">
    <button
      type="submit"
      className="w-full rounded-xl border border-[#d4af37]/40 bg-[#fbf7f0] py-3 text-sm font-bold text-[#5c4010] transition hover:bg-[#f3ebd8] shadow-sm"
    >
      المتابعة كضيف
    </button>
  </form>
</div>
</form>
          </div>

        </div>
      </div>
    </main>
  );
}