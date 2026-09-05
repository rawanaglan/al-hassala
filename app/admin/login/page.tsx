"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    // Set the cookie expected by middleware.ts (valid for 24 hours)
    document.cookie = "admin_session=true; path=/; max-age=86400; SameSite=Lax;";

    // Redirect to the admin dashboard
    router.push("/admin/requests");
    router.refresh();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen text-[var(--foreground)]"
    >
      {/* Ambient Gold Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#e8c060]/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-4">

          {/* Back Button */}
          <div>
            <BackButton label="العودة" />
          </div>

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-gold-gradient text-3xl font-extrabold tracking-widest">
              الحصالة
            </h1>

            <p className="mt-2 text-sm font-semibold text-[#8b6508]">
              لوحة الإدارة
            </p>
          </div>

          {/* Login Card */}
          <div className="card-ceramic rounded-3xl p-8 shadow-xl">

            <div className="mb-8">
              <p className="text-xs font-extrabold tracking-[0.25em] text-[#8b6508]">
                ADMIN ACCESS
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#3a2800]">
                تسجيل الدخول
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6b5839]">
                سجّل الدخول للوصول إلى لوحة إدارة الحصالة.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#3a2800]">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm font-medium text-[#3a2800] outline-none placeholder:text-[#8c7a5c] transition focus:border-[#c59b27] focus:ring-1 focus:ring-[#c59b27]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#3a2800]">
                  كلمة المرور
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm font-medium text-[#3a2800] outline-none placeholder:text-[#8c7a5c] transition focus:border-[#c59b27] focus:ring-1 focus:ring-[#c59b27]"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold-3d w-full rounded-xl px-5 py-3.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs font-semibold text-[#8b6508]">
            الحصالة — مكتبة مهنية رقمية
          </p>

        </div>
      </div>
    </main>
  );
}