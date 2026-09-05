"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function LogoutButton() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables.");
    return null;
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs text-gray-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    >
      تسجيل الخروج
    </button>
  );
}