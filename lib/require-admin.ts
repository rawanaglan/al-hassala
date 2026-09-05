import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  // 1. Fetch current user from server session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch role from your database table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 3. Verify admin role (checks profile table or user metadata)
  const isAdmin =
    profile?.role === "admin" ||
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin";

  if (!isAdmin) {
    redirect("/"); // Kick non-admins to main home page
  }

  return { user, profile };
}