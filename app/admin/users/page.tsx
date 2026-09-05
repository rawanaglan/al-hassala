import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import BackButton from "@/components/BackButton";

export default async function AdminUsersPage() {
  // Get all users
  const supabase = await createSupabaseServerClient();

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  const { data: libraryItems, error: libraryError } = await supabase
    .from("user_library")
    .select("id, user_id, product_id, access_type, granted_at");

  const totalUsers = users?.length || 0;
  const totalAccess = libraryItems?.length || 0;

  const usersWithAccess = new Set(
    libraryItems?.map((item) => item.user_id)
  ).size;

  const getUserAccessCount = (userId: string) => {
    return (
      libraryItems?.filter((item) => item.user_id === userId).length || 0
    );
  };

  return (
    <main dir="rtl" className="min-h-screen text-[var(--foreground)]">
      {/* HEADER */}
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
          
          {/* Back Button positioned cleanly at the top */}
          <div className="mb-4">
            <BackButton label="العودة" />
          </div>

          <div className="mt-4">
            <h1 className="text-gold-gradient text-3xl font-extrabold tracking-tight">
              إدارة المستخدمين
            </h1>
            <p className="mt-1 text-sm font-medium text-[#6b5839]">
              إدارة المستخدمين والوصول إلى المحتوى الرقمي.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* ERRORS */}
        {usersError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-700">
              حدث خطأ أثناء تحميل المستخدمين
            </p>
            <p className="mt-1 text-xs font-semibold text-red-600">
              {usersError.message}
            </p>
          </div>
        )}

        {libraryError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-700">
              حدث خطأ أثناء تحميل صلاحيات المستخدمين
            </p>
            <p className="mt-1 text-xs font-semibold text-red-600">
              {libraryError.message}
            </p>
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-ceramic p-6 rounded-2xl">
            <p className="text-xs font-bold text-[#8b6508]">
              إجمالي المستخدمين
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#3a2800]">
              {totalUsers}
            </p>
          </div>

          <div className="card-ceramic p-6 rounded-2xl">
            <p className="text-xs font-bold text-[#8b6508]">
              المستخدمون أصحاب محتوى
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#3a2800]">
              {usersWithAccess}
            </p>
          </div>

          <div className="card-ceramic p-6 rounded-2xl">
            <p className="text-xs font-bold text-[#8b6508]">
              إجمالي صلاحيات الوصول
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#3a2800]">
              {totalAccess}
            </p>
          </div>
        </div>

        {/* USERS */}
        <div className="card-ceramic mt-10 overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-lg font-bold text-[#3a2800]">
              جميع المستخدمين
            </h2>
          </div>

          {users && users.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {users.map((user) => {
                const accessCount = getUserAccessCount(user.id);

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-5 px-6 py-6 transition hover:bg-[#c59b27]/[0.03] lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* USER INFO */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-base font-bold text-[#3a2800] transition hover:text-[#8b6508]"
                        >
                          {user.email}
                        </Link>

                        {user.role === "admin" ? (
                          <span className="rounded-full border border-[#c59b27]/40 bg-[#c59b27]/10 px-3 py-1 text-xs font-bold text-[#8b6508]">
                            مدير
                          </span>
                        ) : (
                          <span className="rounded-full border border-[var(--border)] bg-black/5 px-3 py-1 text-xs font-semibold text-[#6b5839]">
                            مستخدم
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-[#8c7a5c]">
                        <span>
                          انضم في{" "}
                          {new Date(user.created_at).toLocaleDateString(
                            "ar-EG"
                          )}
                        </span>
                        <span>{accessCount} محتوى</span>
                      </div>
                    </div>

                    {/* ACCESS */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#8c7a5c]">
                          المكتبة
                        </p>
                        <p className="mt-1 font-bold text-[#3a2800]">
                          {accessCount === 0
                            ? "فارغة"
                            : `${accessCount} محتوى`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c59b27]/30 bg-[#c59b27]/10 text-xl">
                👤
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#3a2800]">
                لا يوجد مستخدمون
              </h3>
              <p className="mt-1 text-sm font-medium text-[#6b5839]">
                لم يتم تسجيل أي مستخدمين حتى الآن.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}