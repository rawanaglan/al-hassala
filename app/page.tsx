import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProductSearch from "@/components/ProductSearch";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  // Get current logged-in user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch parent categories
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, description, parent_id")
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--background)] px-6 py-20 text-[var(--foreground)]"
      >
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-[#5c4010]">الحصالة</h1>

          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-50 p-6">
            <p className="font-semibold text-red-600">
              حدث خطأ أثناء الاتصال بقاعدة البيانات.
            </p>

            <pre className="mt-3 overflow-auto text-sm text-red-400">
              {error.message}
            </pre>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
    >
      {/* ================= HEADER ================= */}
      <header className="relative z-20 border-b border-[#d4af37]/30 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-[0.15em] text-[#5c4010] transition hover:text-[#8b6508]"
          >
            الحصالة
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#8c6d31] md:flex">
            <Link href="/" className="transition hover:text-[#5c4010]">
              الرئيسية
            </Link>

            <Link href="/library" className="transition hover:text-[#5c4010]">
              مكتبتي
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#8c6d31]">{user.email}</span>
                <Link
                  href="/library"
                  className="btn-gold-3d rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  اذهب إلى مكتبتي
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-gold-3d rounded-full px-5 py-2.5 text-xs font-bold"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>

          {/* Mobile Navigation */}
          {user ? (
            <div className="flex items-center gap-3 md:hidden">
              <Link
                href="/library"
                className="btn-gold-3d rounded-full px-4 py-2 text-xs font-bold"
              >
                مكتبتي
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-gold-3d rounded-full px-4 py-2 text-xs font-bold md:hidden"
            >
              دخول
            </Link>
          )}
        </div>
      </header>

      {/* ================= HERO WITH LEFT BACKGROUND VIDEO ================= */}
      <section className="relative min-h-[500px] overflow-hidden">
        {/* BACKGROUND LOOPING VIDEO */}
        <div className="pointer-events-none absolute -left-2 top-0 z-0 hidden h-full w-3/4 overflow-hidden lg:block">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-contain object-left-top"
          >
            <source src="/logo.mp4" type="video/mp4" />
          </video>
          {/* Soft gradient fade into the right content */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--background)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-10 lg:pb-32 lg:pt-32">
          <div className="max-w-4xl">
            {/* Small label */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#d4af37]/40 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
              <span className="text-xs font-bold tracking-wide text-[#8c6d31]">
                مكتبة مهنية رقمية
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-extrabold leading-[1.2] tracking-tight text-[#2c220f] sm:text-6xl lg:text-7xl">
              ابنِ مستقبلك
              <br />
              <span className="text-[#8c6d31]">خطوة بخطوة.</span>
            </h1>

            {/* Description */}
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#5c4010] sm:text-lg lg:text-xl">
              محتوى عملي ومختصر يساعدك على تطوير مهاراتك، وفهم الحياة المهنية،
              واتخاذ قرارات أفضل لمستقبلك.
            </p>

            {/* SEARCH CONTAINER */}
            <div className="relative z-50 mt-10 max-w-2xl">
              <ProductSearch />
            </div>

            {/* CTA BUTTONS */}
            <div className="relative z-0 mt-6 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#categories"
                className="btn-gold-3d inline-flex items-center justify-center rounded-xl px-7 py-4 text-sm font-bold"
              >
                استكشف المكتبة
              </Link>

              <Link
                href="/library"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#d4af37]/40 bg-white/90 px-7 py-4 text-sm font-bold text-[#5c4010] transition hover:bg-white"
              >
                اذهب إلى مكتبتي
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DIVIDER ================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="h-px bg-[#d4af37]/30" />
      </div>

      {/* ================= CATEGORIES ================= */}
      <section
        id="categories"
        className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24"
      >
        {/* Section heading */}
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#8b6508] uppercase">
              EXPLORE
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-[#2c220f] sm:text-4xl">
              استكشف التصنيفات
            </h2>
          </div>

          <p className="max-w-md text-xs leading-6 text-[#8c6d31] sm:text-sm">
            اختر المجال الذي تريد تطوير نفسك فيه وابدأ رحلتك من المكان المناسب.
          </p>
        </div>

        {/* Category grid with 3D Yellow Chrome Cards */}
        {categories && categories.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="bg-chrome-yellow-3d group relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 sm:min-h-[500px] lg:p-9"
              >
                {/* 3D Metallic Gloss Overlay Sweep */}
                <div className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                {/* Top bar: Arrow + Pill badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="badge-chrome-3d flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 group-hover:-translate-x-1.5">
                    <span className="text-sm font-bold text-[#5c4010]">←</span>
                  </div>

                  <span className="badge-chrome-3d inline-flex h-10 w-12 items-center justify-center rounded-full text-xs font-black tracking-widest text-[#5c4010]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Body Content */}
                <div className="relative z-10 my-auto text-right">
                  <h3 className="text-2xl font-black text-[#3a2807] drop-shadow-sm transition-colors duration-300 group-hover:text-[#1a1202] sm:text-3xl">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="mt-3 text-xs font-bold leading-6 text-[#5c4010] sm:text-sm sm:leading-7">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Bottom Accent Indicator */}
                <div className="relative z-10 flex justify-end">
                  <div className="h-2 w-16 rounded-full bg-gradient-to-r from-[#ffffff] to-[#8b6508] shadow-inner transition-all duration-500 group-hover:w-full" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#d4af37]/30 bg-white/80 p-12 text-center backdrop-blur-md">
            <p className="text-base font-semibold text-[#8c6d31]">
              لا توجد تصنيفات متاحة حالياً.
            </p>
          </div>
        )}
      </section>

      {/* ================= VALUE SECTION ================= */}
      <section className="relative z-10 border-y border-[#d4af37]/30 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Item 1 */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#8b6508]">
                01
              </p>
              <h3 className="mt-4 text-lg font-bold text-[#2c220f]">
                محتوى عملي
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#8c6d31] sm:text-sm">
                موارد مصممة لتمنحك معرفة يمكنك تطبيقها فعلياً في حياتك المهنية.
              </p>
            </div>

            {/* Item 2 */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#8b6508]">
                02
              </p>
              <h3 className="mt-4 text-lg font-bold text-[#2c220f]">
                تعلم بدون تعقيد
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#8c6d31] sm:text-sm">
                محتوى واضح ومباشر يساعدك على الوصول للمعلومة التي تحتاجها بدون
                إضاعة الوقت.
              </p>
            </div>

            {/* Item 3 */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#8b6508]">
                03
              </p>
              <h3 className="mt-4 text-lg font-bold text-[#2c220f]">
                مكتبتك الخاصة
              </h3>
              <p className="mt-2 text-xs leading-6 text-[#8c6d31] sm:text-sm">
                احتفظ بالمحتوى الذي تملكه واجعله متاحاً لك في أي وقت.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2c220f]">الحصالة</p>
            <p className="mt-1 text-xs text-[#8c6d31]">
              مكتبتك الرقمية للحياة المهنية
            </p>
          </div>

          <div className="flex gap-6 text-xs text-[#8c6d31]">
            <Link href="/" className="transition hover:text-[#2c220f]">
              الرئيسية
            </Link>

            <Link href="/library" className="transition hover:text-[#2c220f]">
              مكتبتي
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}