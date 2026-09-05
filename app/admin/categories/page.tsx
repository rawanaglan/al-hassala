import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteCategoryButton from "./delete-category-button";
import BackButton from "@/components/BackButton";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  category_type: string | null;
  bundle_price: number | null;
  created_at: string;
};

type Product = {
  id: string;
  category_id: string | null;
};

type ProductCategory = {
  product_id: string;
  category_id: string;
};

const categoryTypeLabels: Record<string, string> = {
  role: "دور وظيفي",
  problem: "مشكلة",
  situation: "موقف",
  skill: "مهارة",
  topic: "موضوع",
};

const categoryTypeStyles: Record<string, string> = {
  role: "border-purple-600/30 bg-purple-500/10 text-purple-800 font-semibold",
  problem: "border-red-600/30 bg-red-500/10 text-red-800 font-semibold",
  situation: "border-amber-600/30 bg-amber-500/10 text-amber-800 font-semibold",
  skill: "border-blue-600/30 bg-blue-500/10 text-blue-800 font-semibold",
  topic: "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#8b6508] font-semibold",
};

export default async function AdminCategoriesPage() {
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select(
      "id, name, description, parent_id, category_type, bundle_price, created_at"
    )
    .order("created_at", { ascending: true });

  const { data: products } = await supabase
    .from("products")
    .select("id, category_id");

  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("product_id, category_id");

  const categoryList = (categories || []) as Category[];
  const productList = (products || []) as Product[];
  const productCategoryList =
    (productCategories || []) as ProductCategory[];

  const totalCategories = categoryList.length;

  const parentCategories = categoryList.filter(
    (category) => !category.parent_id
  ).length;

  const subCategories = categoryList.filter(
    (category) => !!category.parent_id
  ).length;

  const getChildren = (parentId: string | null) => {
    return categoryList.filter(
      (category) => category.parent_id === parentId
    );
  };

  const getProductCount = (categoryId: string) => {
    const productIds = new Set<string>();

    productList.forEach((product) => {
      if (product.category_id === categoryId) {
        productIds.add(product.id);
      }
    });

    productCategoryList.forEach((item) => {
      if (item.category_id === categoryId) {
        productIds.add(item.product_id);
      }
    });

    return productIds.size;
  };

  const renderCategoryTree = (
    parentId: string | null,
    depth = 0
  ): React.ReactNode => {
    const children = getChildren(parentId);

    if (children.length === 0) {
      return null;
    }

    return children.map((category) => {
      const categoryChildren = getChildren(category.id);
      const hasChildren = categoryChildren.length > 0;

      const categoryType = category.category_type || "topic";

      const typeLabel =
        categoryTypeLabels[categoryType] || "موضوع";

      const typeStyle =
        categoryTypeStyles[categoryType] ||
        categoryTypeStyles.topic;

      const productCount = getProductCount(category.id);

      return (
        <div key={category.id}>
          {/* CATEGORY */}
          <div
            className="flex flex-col gap-5 border-b border-[var(--border)] px-6 py-6 transition hover:bg-black/[0.02] lg:flex-row lg:items-center lg:justify-between"
            style={{
              paddingRight: `${24 + depth * 40}px`,
            }}
          >
            {/* CATEGORY INFO */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {depth > 0 && (
                  <span className="text-lg font-bold text-[#8b6508]">
                    ↳
                  </span>
                )}

                <h3 className="text-lg font-bold text-[#3a2800]">
                  {category.name}
                </h3>

                {/* CATEGORY TYPE */}
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${typeStyle}`}
                >
                  {typeLabel}
                </span>

                {/* ROOT CATEGORY */}
                {depth === 0 && (
                  <span className="rounded-full border border-[#d4af37]/40 bg-white/60 px-3 py-1 text-xs font-semibold text-[#8b6508]">
                    تصنيف رئيسي
                  </span>
                )}

                {/* CHILD CATEGORY */}
                {depth > 0 && (
                  <span className="rounded-full border border-[var(--border)] bg-white/40 px-3 py-1 text-xs font-medium text-[#6b5839]">
                    تصنيف فرعي
                  </span>
                )}
              </div>

              {/* DESCRIPTION */}
              {category.description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b5839]">
                  {category.description}
                </p>
              )}

              {/* META */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#8c7a5c]">
                <span>
                  {productCount} محتوى
                </span>

                {hasChildren && (
                  <span>
                    {categoryChildren.length} تصنيف فرعي
                  </span>
                )}

                {category.bundle_price !== null && category.bundle_price > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-2.5 py-0.5 font-bold text-[#8b6508]">
                    📦 سعر الباقة: {category.bundle_price} جنيه
                  </span>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex shrink-0 flex-wrap gap-2">
              {/* VIEW */}
              <Link
                href={`/categories/${category.id}`}
                className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-bold"
              >
                عرض
              </Link>

              {/* ADD CHILD */}
              <Link
                href={`/admin/categories/new?parent_id=${category.id}`}
                className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-bold"
              >
                + فرعي
              </Link>

              {/* EDIT */}
              <Link
                href={`/admin/categories/new?edit=${category.id}`}
                className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-bold"
              >
                تعديل
              </Link>

              {/* DELETE */}
              <DeleteCategoryButton
                categoryId={category.id}
                categoryName={category.name}
              />
            </div>
          </div>

          {/* CHILDREN */}
          {hasChildren && (
            <div className="bg-white/30">
              {renderCategoryTree(category.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen text-[var(--foreground)]"
    >
      {/* HEADER */}
      <header className="border-b border-[var(--border)] bg-white/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:px-10">
          <div>
            <BackButton label="العودة للوحة التحكم" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-gold-gradient text-3xl font-bold">
                إدارة التصنيفات
              </h1>

              <p className="mt-2 text-sm text-[#6b5839]">
                بناء وتنظيم شجرة المعرفة الخاصة بالحصالة.
              </p>
            </div>

            {/* ADD ROOT CATEGORY */}
            <Link
              href="/admin/categories/new"
              className="btn-gold-3d rounded-full px-6 py-3 text-sm font-bold self-start md:self-auto"
            >
              + إضافة تصنيف
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* ERROR */}
        {categoriesError && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-700">
              حدث خطأ أثناء تحميل التصنيفات
            </p>

            <p className="mt-2 text-sm text-red-600">
              {categoriesError.message}
            </p>
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              إجمالي التصنيفات
            </p>

            <p className="text-gold-gradient mt-3 text-3xl font-extrabold">
              {totalCategories}
            </p>
          </div>

          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              التصنيفات الرئيسية
            </p>

            <p className="text-gold-gradient mt-3 text-3xl font-extrabold">
              {parentCategories}
            </p>
          </div>

          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-sm font-semibold text-[#8b6508]">
              التصنيفات الفرعية
            </p>

            <p className="text-gold-gradient mt-3 text-3xl font-extrabold">
              {subCategories}
            </p>
          </div>
        </div>

        {/* KNOWLEDGE TREE */}
        <div className="card-ceramic mt-10 overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-gold-gradient text-lg font-bold">
              شجرة المعرفة
            </h2>

            <p className="mt-1 text-xs font-medium text-[#6b5839]">
              نظّم المحتوى حسب الأدوار والمشكلات والمواقف والمهارات.
            </p>
          </div>

          {categoryList.length > 0 ? (
            <div>
              {renderCategoryTree(null)}
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-white/60 text-xl font-bold text-[#8b6508]">
                +
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#3a2800]">
                لا توجد تصنيفات حتى الآن
              </h3>

              <p className="mt-2 text-sm text-[#8c7a5c]">
                ابدأ ببناء أول جزء من شجرة المعرفة.
              </p>

              <Link
                href="/admin/categories/new"
                className="btn-gold-3d mt-6 inline-flex rounded-full px-6 py-3 text-xs font-bold"
              >
                إضافة تصنيف
              </Link>
            </div>
          )}
        </div>

        {/* CATEGORY TYPE LEGEND */}
        <div className="card-ceramic mt-6 rounded-2xl p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#8b6508]">
            CATEGORY TYPES
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(categoryTypeLabels).map(
              ([type, label]) => (
                <span
                  key={type}
                  className={`rounded-full border px-3.5 py-1.5 text-xs ${
                    categoryTypeStyles[type]
                  }`}
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}