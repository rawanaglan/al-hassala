import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductSearch from "@/components/ProductSearch";
import BackButton from "@/components/BackButton";
import ConsultationSection from "@/components/ConsultationSection";
import PaidChatSection from "@/components/PaidChatSection";
import CategoryBundleModal from "@/components/CategoryBundleModal";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  bundle_price: number | null;
  image_url: string | null;
};

type Product = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  file_url?: string | null;
  created_at?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getBreadcrumbTrail(
  parentId: string | null
): Promise<Category[]> {
  const trail: Category[] = [];
  let currentParentId = parentId;

  while (currentParentId) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, name, description, parent_id, bundle_price, image_url")
      .eq("id", currentParentId)
      .single();

    if (!parent) break;

    trail.unshift(parent as Category);
    currentParentId = parent.parent_id;
  }

  return trail;
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;

  // 1. FETCH CURRENT CATEGORY
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, description, parent_id, bundle_price, image_url")
    .eq("id", id)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  const isConsultationsCategory = category.name.trim() === "استشارات";

  // Fetch dedicated category bundle ID from category_bundles table
  let categoryBundleId: string | null = null;
  if (category.bundle_price !== null && category.bundle_price > 0) {
    const { data: bundleData } = await supabase
      .from("category_bundles")
      .select("id")
      .eq("category_id", category.id)
      .maybeSingle();

    if (bundleData) {
      categoryBundleId = bundleData.id;
    }
  }

  // 2. FETCH DIRECT SUBCATEGORIES
  const { data: subcategoriesData } = await supabase
    .from("categories")
    .select("id, name, description, parent_id, bundle_price, image_url")
    .eq("parent_id", id)
    .order("name", { ascending: true });

  const subcategories = (subcategoriesData || []) as Category[];

  // 3. FETCH PRODUCTS AT THIS CATEGORY LEVEL
  let productList: Product[] = [];

  const [catRes, subcatRes, junctionRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, short_description, description, price, file_url, created_at")
      .eq("category_id", id)
      .eq("is_published", true),
    supabase
      .from("products")
      .select("id, title, short_description, description, price, file_url, created_at")
      .eq("subcategory_id", id)
      .eq("is_published", true),
    supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", id)
  ]);

  let junctionProducts: Product[] = [];
  const junctionIds = (junctionRes.data || []).map((row) => row.product_id);
  
  if (junctionIds.length > 0) {
    const { data: jProducts } = await supabase
      .from("products")
      .select("id, title, short_description, description, price, file_url, created_at")
      .in("id", junctionIds)
      .eq("is_published", true);
    
    junctionProducts = (jProducts || []) as Product[];
  }

  const allFoundProducts = [
    ...(catRes.data || []),
    ...(subcatRes.data || []),
    ...junctionProducts,
  ];

  const uniqueMap = new Map();
  allFoundProducts.forEach((p) => uniqueMap.set(p.id, p));
  
  productList = Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  ) as Product[];

  // 4. BREADCRUMBS
  const breadcrumbTrail = await getBreadcrumbTrail(category.parent_id);

  const hasBundle = category.bundle_price !== null && category.bundle_price > 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#faf9f6] text-[var(--foreground)]"
    >
      {/* HEADER & BREADCRUMBS */}
      <header className="relative border-b border-[#d4af37]/30 bg-white/90 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <div>
            <BackButton label="العودة للخلف" />
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8c6d31]">
            <Link href="/" className="transition hover:text-[#5c4010]">
              الرئيسية
            </Link>

            {breadcrumbTrail.map((ancestor) => (
              <span key={ancestor.id} className="flex items-center gap-2">
                <span className="opacity-40">/</span>
                <Link
                  href={`/categories/${ancestor.id}`}
                  className="transition hover:text-[#5c4010]"
                >
                  {ancestor.name}
                </Link>
              </span>
            ))}

            <span className="opacity-40">/</span>
            <span className="font-extrabold text-[#2c220f]">
              {category.name}
            </span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              {/* Parent Category Banner / Cover Photo integration if available */}
              {category.image_url && (
                <div className="relative h-48 w-full max-w-xl overflow-hidden rounded-3xl border-2 border-[#d4af37]/40 shadow-md">
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <h1 className="text-4xl font-black tracking-tight text-[#2c220f] sm:text-5xl">
                  {category.name}
                </h1>

                {category.description && (
                  <p className="mt-3 max-w-2xl text-base font-semibold text-[#6e5422]">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            {/* CATEGORY BUNDLE PURCHASE CALLOUT */}
            {hasBundle && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-3xl border-2 border-[#d4af37] bg-gradient-to-br from-[#fffdfa] via-[#fdfbf7] to-[#f4ecd0] p-6 shadow-xl backdrop-blur-md">
                <div className="space-y-1">
                  <span className="inline-block rounded-full bg-[#d4af37]/20 px-3 py-0.5 text-[10px] font-extrabold text-[#7a5905]">
                    باقة شاملة مميزة ✨
                  </span>
                  <h3 className="text-lg font-black text-[#2c220f]">
                    احصل على كل محتويات التصنيف دفعة واحدة!
                  </h3>
                  <p className="text-xs font-bold text-[#8b6508]">
                    وفر أكثر وافتح كافة ملفات وملحقات قسم {category.name} بسعر خاص.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xl font-black text-[#8b6508]">
                    {category.bundle_price} جنيه
                  </span>
                  <CategoryBundleModal
                    categoryId={category.id}
                    categoryName={category.name}
                    bundlePrice={category.bundle_price!}
                    bundleId={categoryBundleId}
                  />
                </div>
              </div>
            )}
          </div>

          {!isConsultationsCategory && (
            <div className="relative max-w-2xl pt-2">
              <ProductSearch categoryId={category.id} />
            </div>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-10 space-y-12">
        {isConsultationsCategory ? (
          <div className="space-y-16">
            <div className="card-ceramic rounded-3xl p-8 sm:p-10 border border-[#d4af37]/30 shadow-lg">
              <ConsultationSection />
            </div>

            <div className="card-ceramic rounded-3xl p-8 sm:p-10 border border-[#d4af37]/30 shadow-lg">
              <PaidChatSection />
            </div>
          </div>
        ) : (
          <>
            {subcategories.length > 0 && (
              <div>
                <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-[#2c220f]">
                  <span>📁</span>
                  <span>الأقسام الفرعية</span>
                  <span className="inline-flex items-center rounded-full border border-[#d4af37]/40 bg-white/80 px-3 py-1 text-xs font-black text-[#8b6508] shadow-sm backdrop-blur-sm">
                    {subcategories.length}
                  </span>
                </h2>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {subcategories.map((sub, idx) => (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.id}`}
                      className="group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[#d4af37]/40 bg-gradient-to-br from-[#ffffff] via-[#f7f5ef] to-[#eee8d5] p-6 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-[#d4af37]"
                    >
                      <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />

                      {/* Subcategory Cover Photo thumbnail */}
                      {sub.image_url ? (
                        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-[#d4af37]/30 shadow-inner">
                          <Image
                            src={sub.image_url}
                            alt={sub.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-white/90 text-xs font-black text-[#8b6508] shadow-sm backdrop-blur-md">
                            0{idx + 1}
                          </span>
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-white/90 text-base font-bold text-[#8b6508] shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:-translate-x-2">
                            ←
                          </span>
                        </div>
                      )}

                      <div className="relative z-10 my-4">
                        <h3 className="text-2xl font-black text-[#2c220f] transition-colors duration-300 group-hover:text-[#8b6508]">
                          {sub.name}
                        </h3>
                        {sub.description && (
                          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-[#5c4010]">
                            {sub.description}
                          </p>
                        )}
                      </div>

                      <div className="relative z-10 flex items-center gap-3 pt-2">
                        <div className="h-1.5 w-12 rounded-full bg-[#d4af37] transition-all duration-500 group-hover:w-full" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(productList.length > 0 || subcategories.length === 0) && (
              <div>
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-[#2c220f]">
                  <span>📄</span>
                  <span>الملفات والمستندات</span>
                  <span className="inline-flex items-center rounded-full border border-[#d4af37]/40 bg-white/80 px-3 py-1 text-xs font-black text-[#8b6508] shadow-sm backdrop-blur-sm">
                    {productList.length}
                  </span>
                </h2>

                {productList.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-white/80 backdrop-blur-md shadow-lg divide-y divide-[#d4af37]/20">
                    {productList.map((product) => {
                      const isPaid = product.price && product.price > 0;

                      return (
                        <div
                          key={product.id}
                          className="flex flex-col gap-4 p-6 transition duration-300 hover:bg-white/90 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-4">
                            <span className="mt-1 text-2xl">🔗</span>
                            <div>
                              <span className="text-lg font-bold text-[#2c220f]">
                                {product.title}
                              </span>
                              {product.short_description && (
                                <p className="mt-1 text-sm font-medium text-[#6e5422]">
                                  {product.short_description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <Link
                              href={`/products/${product.id}`}
                              className="btn-gold-3d inline-flex items-center rounded-xl px-5 py-2.5 text-xs font-bold"
                            >
                              {isPaid ? `شراء (${product.price} جنيه)` : "عرض التفاصيل والشرح"}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-[#d4af37]/30 bg-white/70 p-12 text-center text-sm font-semibold text-[#8c6d31] backdrop-blur-sm">
                    لا توجد ملفات مرفوعة في هذا القسم حالياً.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}