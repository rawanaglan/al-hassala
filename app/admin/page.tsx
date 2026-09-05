import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import BackButton from "@/components/BackButton";

export default async function AdminDashboard() {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();

  // Fetch dashboard data
  const [
    { count: totalProducts },
    { count: publishedProducts },
    { count: draftProducts },
    { count: totalCategories },
    { count: totalUsers },
    { data: recentProducts },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", false),

    supabase
      .from("categories")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("products")
      .select(
        "id, title, code, price, is_free, is_published, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <main
      dir="rtl"
      className="min-h-screen text-[var(--foreground)]"
    >
      {/* HEADER */}
      <header className="border-b border-[var(--border)] bg-white/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
          
          {/* Back Button positioned cleanly at the top */}
    

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-[#8b6508]">
                لوحة الإدارة
              </p>

              <h1 className="text-gold-gradient mt-3 text-3xl font-bold sm:text-4xl">
                مرحباً بك في الحصالة
              </h1>

              <p className="mt-3 max-w-2xl text-[#6b5839]">
                إدارة المكتبة والمحتوى والمستخدمين من مكان واحد.
              </p>
            </div>

            {/* LOGOUT BUTTON FORM */}
            <form
              action={async () => {
                "use server";
                const cookieStore = await cookies();
                cookieStore.delete("admin_session");
                redirect("/admin/login");
              }}
            >
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-red-600 to-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-red-500 hover:to-rose-600 hover:shadow-lg active:translate-y-0.5"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* PRODUCTS */}
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              إجمالي المحتوى
            </p>

            <p className="text-gold-gradient mt-4 text-4xl font-extrabold">
              {totalProducts ?? 0}
            </p>

            <p className="mt-2 text-xs text-[#8c7a5c]">
              جميع الموارد
            </p>
          </div>

          {/* PUBLISHED */}
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              المحتوى المنشور
            </p>

            <p className="text-gold-gradient mt-4 text-4xl font-extrabold">
              {publishedProducts ?? 0}
            </p>

            <p className="mt-2 text-xs text-[#8c7a5c]">
              ظاهر في المكتبة
            </p>
          </div>

          {/* DRAFTS */}
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              المسودات
            </p>

            <p className="text-gold-gradient mt-4 text-4xl font-extrabold">
              {draftProducts ?? 0}
            </p>

            <p className="mt-2 text-xs text-[#8c7a5c]">
              غير منشورة
            </p>
          </div>

          {/* USERS */}
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              المستخدمون
            </p>

            <p className="text-gold-gradient mt-4 text-4xl font-extrabold">
              {totalUsers ?? 0}
            </p>

            <p className="mt-2 text-xs text-[#8c7a5c]">
              إجمالي الحسابات
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#8b6508]">
            إجراءات سريعة
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/products/new"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              + إضافة محتوى
            </Link>

            <Link
              href="/admin/products"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              إدارة المحتوى ←
            </Link>

            <Link
              href="/admin/categories"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              إدارة التصنيفات →
            </Link>

            <Link
              href="/admin/users"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              إدارة المستخدمين →
            </Link>

            {/* NEW CONSULTATIONS & CHAT ADMIN BUTTON */}
            <Link
              href="/admin/consultations"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              💬 إدارة الاستشارات والأسئلة
            </Link>

            <Link 
              href="/admin/requests" 
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              📋 طلبات الوصول (Requests)
            </Link>

            <Link 
              href="/admin/analytics" 
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold"
            >
              📊 الإحصائيات (Analytics)
            </Link>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

          {/* RECENT PRODUCTS */}
          <div className="card-ceramic overflow-hidden rounded-2xl">

            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#8b6508]">
                  المحتوى
                </p>

                <h2 className="text-gold-gradient mt-1 text-lg font-bold">
                  أحدث المحتويات
                </h2>
              </div>

              <Link
                href="/admin/products"
                className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-bold"
              >
                عرض الكل →
              </Link>
            </div>

            {recentProducts && recentProducts.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-bold text-[#3a2800]">
                          {product.title}
                        </h3>

                        {product.is_published ? (
                          <span className="rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#8b6508]">
                            منشور
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            مسودة
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#8c7a5c]">
                        {product.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold text-[#4a340b]">
                        {product.is_free
                          ? "مجاناً"
                          : `${product.price} جنيه`}
                      </p>

                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-bold"
                      >
                        تعديل
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="text-[#8c7a5c]">
                  لا يوجد محتوى حتى الآن.
                </p>

                <Link
                  href="/admin/products/new"
                  className="btn-gold-3d mt-5 inline-flex rounded-full px-6 py-2.5 text-xs font-bold"
                >
                  إضافة أول محتوى
                </Link>
              </div>
            )}
          </div>

          {/* OVERVIEW */}
          <div className="card-ceramic rounded-2xl p-6">

            <p className="text-xs font-semibold tracking-[0.2em] text-[#8b6508]">
              نظرة عامة
            </p>

            <h2 className="text-gold-gradient mt-2 text-xl font-bold">
              حالة المكتبة
            </h2>

            <div className="mt-8 space-y-5">

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b5839]">
                  المحتوى
                </span>

                <span className="font-bold text-[#3a2800]">
                  {totalProducts ?? 0}
                </span>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b5839]">
                  المنشور
                </span>

                <span className="font-bold text-[#3a2800]">
                  {publishedProducts ?? 0}
                </span>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b5839]">
                  المسودات
                </span>

                <span className="font-bold text-[#3a2800]">
                  {draftProducts ?? 0}
                </span>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b5839]">
                  التصنيفات
                </span>

                <span className="font-bold text-[#3a2800]">
                  {totalCategories ?? 0}
                </span>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b5839]">
                  المستخدمون
                </span>

                <span className="font-bold text-[#3a2800]">
                  {totalUsers ?? 0}
                </span>
              </div>

            </div>

            <div className="mt-8 rounded-xl border border-[var(--border)] bg-white/40 p-4">
              <p className="text-xs leading-6 text-[#6b5839]">
                استخدم لوحة التحكم لإدارة المحتوى والتصنيفات
                المستخدمين والحصول على نظرة سريعة على حالة المكتبة.
              </p>
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}