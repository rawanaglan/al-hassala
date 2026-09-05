import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import GrantAccessForm from "./grant-access-form";
import RemoveAccessButton from "./remove-access-button";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailsPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  // Get user
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("id", id)
    .single();

  // User not found
  if (userError || !user) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#080808] px-6 py-20 text-white"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm text-gray-600">404</p>

          <h1 className="text-3xl font-bold">
            المستخدم غير موجود
          </h1>

          <p className="mt-4 text-gray-500">
            المستخدم الذي تبحث عنه غير موجود أو لم يعد متاحاً.
          </p>

          <Link
            href="/admin"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-300"
          >
            العودة للوحة التحكم الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  // Get user's library access
  const { data: libraryItems, error: libraryError } = await supabase
    .from("user_library")
    .select(
      "id, product_id, access_type, granted_at"
    )
    .eq("user_id", user.id)
    .order("granted_at", { ascending: false });

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, code, title, price, product_type, is_free, is_published"
    )
    .order("created_at", { ascending: false });

  // Match library records to products
  const userProducts =
    libraryItems?.map((item) => ({
      ...item,
      product: products?.find(
        (product) => product.id === item.product_id
      ),
    })) || [];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#080808] text-white"
    >
      {/* HEADER */}

      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">

          <Link
            href="/admin"
            className="text-sm text-gray-500 transition hover:text-white"
          >
            ← العودة للوحة التحكم الرئيسية
          </Link>

          <div className="mt-6">
            <p className="text-xs tracking-[0.25em] text-gray-600">
              USER DETAILS
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              {user.email}
            </h1>

            <div className="mt-3 flex flex-wrap gap-3">

              {user.role === "admin" ? (
                <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs text-gray-300">
                  مدير
                </span>
              ) : (
                <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-gray-500">
                  مستخدم
                </span>
              )}

              <span className="text-xs text-gray-600">
                انضم في{" "}
                {new Date(user.created_at).toLocaleDateString("ar-EG")}
              </span>

            </div>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-6">
            <p className="text-sm text-gray-500">
              المحتوى المتاح
            </p>

            <p className="mt-3 text-3xl font-bold">
              {libraryItems?.length || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-6">
            <p className="text-sm text-gray-500">
              المحتوى المجاني
            </p>

            <p className="mt-3 text-3xl font-bold">
              {
                userProducts.filter(
                  (item) => item.access_type === "free"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-6">
            <p className="text-sm text-gray-500">
              إجمالي المحتوى بالمكتبة
            </p>

            <p className="mt-3 text-3xl font-bold">
              {libraryItems?.length || 0}
            </p>
          </div>

        </div>

        {/* ERRORS */}

        {libraryError && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
            <p className="text-red-400">
              حدث خطأ أثناء تحميل مكتبة المستخدم
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {libraryError.message}
            </p>
          </div>
        )}

        {productsError && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
            <p className="text-red-400">
              حدث خطأ أثناء تحميل المحتوى
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {productsError.message}
            </p>
          </div>
        )}

        {/* USER LIBRARY */}

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101010]">

          <div className="border-b border-white/[0.06] px-6 py-5">

            <h2 className="text-lg font-semibold">
              مكتبة المستخدم
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              المحتوى الذي يستطيع هذا المستخدم الوصول إليه.
            </p>

          </div>

          {userProducts.length > 0 ? (

            <div className="divide-y divide-white/[0.05]">

              {userProducts.map((item) => (

                <div
                  key={item.id}
                  className="flex flex-col gap-5 px-6 py-6 transition hover:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* PRODUCT */}

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-semibold">
                        {item.product?.title || "محتوى غير موجود"}
                      </h3>

                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                        {item.access_type === "free"
                          ? "مجاني"
                          : item.access_type}
                      </span>

                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">

                      <span>
                        {item.product?.code || "—"}
                      </span>

                      <span>
                        {item.product?.product_type || "—"}
                      </span>

                      <span>
                        تم المنح في{" "}
                        {new Date(
                          item.granted_at
                        ).toLocaleDateString("ar-EG")}
                      </span>

                    </div>

                  </div>

                  {/* PRICE */}

                  <div className="text-right lg:min-w-[120px]">

                    {item.product?.is_free ? (
                      <p className="font-medium text-gray-300">
                        مجاناً
                      </p>
                    ) : (
                      <p className="font-medium text-gray-300">
                        {item.product?.price} جنيه
                      </p>
                    )}

                  </div>

                  {/* VIEW & REMOVE */}

                  <div className="flex items-center gap-3">
                    {item.product && (
                      <Link
                        href={`/products/${item.product.id}`}
                        className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                      >
                        عرض المحتوى
                      </Link>
                    )}
                    <RemoveAccessButton
                      userId={user.id}
                      productId={item.product_id}
                      productTitle={item.product?.title || "هذا المحتوى"}
                    />
                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] text-xl text-gray-600">
                📚
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                المكتبة فارغة
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                لا يمتلك هذا المستخدم أي محتوى حتى الآن.
              </p>

            </div>

          )}

        </div>

      {/* ACCESS MANAGEMENT */}

      <div className="mt-8">
        <GrantAccessForm
          userId={user.id}
          products={
            products?.map((product) => ({
              id: product.id,
              code: product.code,
              title: product.title,
              price: product.price,
              is_free: product.is_free,
            })) || []
          }
        />
      </div>

      </section>

    </main>
  );
}