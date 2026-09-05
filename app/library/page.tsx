import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";
import BackButton from "@/components/BackButton";

type LibraryProduct = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  product_type: string | null;
  cover_image_url: string | null;
  reading_time: number | null;
  page_count: number | null;
  difficulty_level: string | null;
};

type LibraryItem = {
  id: string;
  access_type: string;
  granted_at: string;
  product: LibraryProduct | null;
};

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/library");
  }

  // Get user library by user ID
  const { data, error } = await supabase
    .from("user_library")
    .select(`
      id,
      access_type,
      granted_at,
      product:products (
        id,
        title,
        short_description,
        description,
        product_type,
        cover_image_url,
        reading_time,
        page_count,
        difficulty_level
      )
    `)
    .eq("user_id", user.id);

  // Normalize data
  const items: LibraryItem[] = (data ?? []).map((item: any) => {
    const rawProduct = item.product;
    let product: LibraryProduct | null = null;

    if (rawProduct && !Array.isArray(rawProduct)) {
      product = rawProduct as LibraryProduct;
    }

    if (Array.isArray(rawProduct) && rawProduct.length > 0) {
      product = rawProduct[0] as LibraryProduct;
    }

    return {
      id: item.id,
      access_type: item.access_type ?? "purchased",
      granted_at: item.granted_at ?? new Date().toISOString(),
      product,
    };
  });

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
    >
      {/* ================= HEADER ================= */}
      <header className="relative z-10 border-b border-[#d4af37]/30 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="text-xl font-bold tracking-[0.15em] text-[#5c4010] transition hover:text-[#8b6508]"
          >
            الحصالة
          </Link>

          <div className="flex items-center gap-5">
            <span className="hidden text-xs text-[#8c6d31] sm:block">
              {user.email}
            </span>

            <Link
              href="/"
              className="text-sm font-semibold text-[#8c6d31] transition hover:text-[#5c4010]"
            >
              الرئيسية
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-[#d4af37]/30 bg-white/40">
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20 space-y-6">
          {/* BACK BUTTON */}
          <div>
            <BackButton label="العودة للخلف" />
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-[#8b6508]">
              مكتبتك الشخصية
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#2c220f] sm:text-5xl">
              مكتبتي
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#5c4010]">
              كل المحتوى الذي حصلت عليه محفوظ هنا ويمكنك الرجوع إليه في أي وقت.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-white px-4 py-2 text-xs font-bold text-[#8c6d31] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
              {items.length} محتوى
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIBRARY CONTENT ================= */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-600">
              حدث خطأ أثناء تحميل مكتبتك
            </h2>
            <p className="mt-2 text-sm text-red-400">{error.message}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="card-ceramic rounded-3xl p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#fbf7f0] text-2xl shadow-inner">
              📚
            </div>

            <h2 className="mt-6 text-2xl font-bold text-[#2c220f]">
              مكتبتك فارغة
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8c6d31]">
              لم تحصل على أي محتوى بعد. استكشف المكتبة واختر المحتوى الذي يناسب احتياجاتك.
            </p>

            <Link
              href="/"
              className="btn-gold-3d mt-8 inline-flex rounded-xl px-7 py-3 text-sm font-bold"
            >
              استكشف المكتبة
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <Link
                  key={item.id}
                  href={`/products/${product.id}`}
                  className="card-ceramic group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* COVER */}
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#fbf7f0]">
                    {product.cover_image_url ? (
                      <img
                        src={product.cover_image_url}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold text-[#8c6d31]/60">
                        الحصالة
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8c6d31]">
                      {product.product_type && (
                        <span>{product.product_type}</span>
                      )}

                      {product.difficulty_level && (
                        <>
                          <span>•</span>
                          <span>{product.difficulty_level}</span>
                        </>
                      )}

                      {product.reading_time && (
                        <>
                          <span>•</span>
                          <span>{product.reading_time} دقيقة</span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-[#2c220f] transition group-hover:text-[#8b6508]">
                      {product.title}
                    </h2>

                    {(product.short_description || product.description) && (
                      <p className="mt-3 line-clamp-3 text-sm font-medium leading-7 text-[#6e5422]">
                        {product.short_description || product.description}
                      </p>
                    )}

                    <div className="mt-6 flex items-center justify-between border-t border-[#d4af37]/20 pt-4">
                      <span className="inline-flex items-center rounded-full border border-[#d4af37]/40 bg-[#fbf7f0] px-3 py-1 text-xs font-black text-[#8b6508] shadow-inner">
                        {item.access_type === "free" ? "مجاني" : "مملوك"}
                      </span>

                      <span className="text-sm font-bold text-[#8b6508] transition duration-300 group-hover:-translate-x-1">
                        فتح المحتوى ←
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#d4af37]/30 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-xs font-bold text-[#2c220f]">© الحصالة</p>

          <Link
            href="/"
            className="text-xs font-semibold text-[#8c6d31] transition hover:text-[#2c220f]"
          >
            الرئيسية
          </Link>
        </div>
      </footer>
    </main>
  );
}