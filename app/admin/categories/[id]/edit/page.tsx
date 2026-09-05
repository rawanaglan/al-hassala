import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  bundle_price: number | null;
};

type Product = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  file_url?: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getSafeFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("file://")) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const cleanPath = url.replace(/^\//, "");
    return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
  }

  return null;
}

// Server action to handle direct bundle orders on the category page
async function handleBundleOrder(formData: FormData) {
  "use server";

  const categoryId = formData.get("category_id") as string;
  const categoryName = formData.get("category_name") as string;
  const bundlePrice = parseFloat(formData.get("bundle_price") as string);
  const customerName = formData.get("customer_name") as string;
  const customerEmail = formData.get("customer_email") as string;
  const customerPhone = formData.get("customer_phone") as string;
  const paymentProofFile = formData.get("payment_proof") as File;

  let proofUrl = null;

  // Upload payment proof if provided
  if (paymentProofFile && paymentProofFile.size > 0) {
    const fileExt = paymentProofFile.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, paymentProofFile);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);
      proofUrl = publicUrlData.publicUrl;
    }
  }

  // 1. Insert into orders table
  const { error: orderError } = await supabase.from("orders").insert([
    {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      total_amount: bundlePrice,
      status: "pending",
      payment_proof_url: proofUrl,
      notes: `طلب شراء باقة تصنيف كاملة: ${categoryName}`,
      category_id: categoryId,
    },
  ]);

  if (orderError) {
    console.error("Error creating bundle order:", orderError);
    throw new Error("حدث خطأ أثناء إرسال طلب الشراء.");
  }

  // 2. Trigger admin notification in the database
  await supabase.from("admin_notifications").insert([
    {
      title: "طلب شراء باقة جديد 📦",
      message: `قام العميل ${customerName} بطلب شراء باقة التصنيف "${categoryName}" بقيمة ${bundlePrice} جنيه.`,
      is_read: false,
    },
  ]);

  redirect("/checkout/success");
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;

  // 1. FETCH CATEGORY (including bundle_price)
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, description, parent_id, bundle_price")
    .eq("id", id)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // 2. FETCH PAYMENT SETTINGS (for InstaPay instructions)
  const { data: settings } = await supabase
    .from("site_settings")
    .select("instapay_username, instapay_qr_url")
    .single();

  // 3. FETCH SUBCATEGORIES
  const { data: subcategoriesData } = await supabase
    .from("categories")
    .select("id, name, description, parent_id, bundle_price")
    .eq("parent_id", id)
    .order("name", { ascending: true });

  const subcategories = (subcategoriesData || []) as Category[];

  // 4. FETCH PRODUCTS
  let productList: Product[] = [];

  const { data: directProducts } = await supabase
    .from("products")
    .select("id, title, short_description, description, price, file_url")
    .or(`category_id.eq.${id},subcategory_id.eq.${id}`)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (directProducts && directProducts.length > 0) {
    productList = directProducts as Product[];
  } else {
    const { data: pCatRows } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", id);

    const productIds = (pCatRows || []).map((row) => row.product_id);

    if (productIds.length > 0) {
      const { data: junctionProducts } = await supabase
        .from("products")
        .select("id, title, short_description, description, price, file_url")
        .in("id", productIds)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      productList = (junctionProducts || []) as Product[];
    }
  }

  // 5. PARENT BREADCRUMB
  let parentCategory: Category | null = null;
  if (category.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("id", category.parent_id)
      .single();

    parentCategory = parent as Category | null;
  }

  const hasBundlePrice = category.bundle_price !== null && category.bundle_price > 0;

  return (
    <main dir="rtl" className="min-h-screen text-[var(--foreground)]">
      {/* HEADER & BREADCRUMBS */}
      <header className="border-b border-[var(--border)] bg-white/50 py-10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          {/* BACK BUTTON */}
          <div>
            <BackButton label="العودة للخلف" />
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold text-[#8b6508]">
            <Link href="/" className="transition hover:text-[#4a340b]">
              الرئيسية
            </Link>
            <span>/</span>
            {parentCategory && (
              <>
                <Link
                  href={`/categories/${parentCategory.id}`}
                  className="transition hover:text-[#4a340b]"
                >
                  {parentCategory.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-bold text-[#3a2800]">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-gold-gradient text-3xl font-bold tracking-tight sm:text-4xl">
                {category.name}
              </h1>

              {category.description && (
                <p className="mt-3 max-w-2xl text-base font-medium text-[#6b5839]">
                  {category.description}
                </p>
              )}
            </div>

            {/* BUNDLE BADGE CALLOUT */}
            {hasBundlePrice && (
              <div className="card-ceramic rounded-2xl border border-[#d4af37]/40 p-4 self-start flex items-center gap-4 bg-gradient-to-r from-[#fffdfa] to-[#f7eed3]">
                <div>
                  <span className="text-xs font-bold text-[#8b6508]">باقة التصنيف بالكامل</span>
                  <p className="text-xl font-black text-[#2c220f]">{category.bundle_price} جنيه</p>
                </div>
                <a
                  href="#bundle-checkout"
                  className="btn-gold-3d rounded-xl px-4 py-2.5 text-xs font-black shadow-md"
                >
                  شراء الباقة 📦
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 space-y-16">
        {/* SECTION A: NESTED SUBCATEGORIES */}
        {subcategories.length > 0 && (
          <div>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#3a2800]">
              <span>📁</span>
              <span>الأقسام الفرعية</span>
              <span className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-[#8b6508]">
                {subcategories.length}
              </span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.id}`}
                  className="card-ceramic group flex flex-col justify-between rounded-2xl p-5 transition hover:scale-[1.01]"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between text-2xl">
                      <span>📂</span>
                      <span className="text-sm font-bold text-[#8b6508] transition group-hover:-translate-x-1">
                        ←
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#3a2800]">
                      {sub.name}
                    </h3>
                    {sub.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[#6b5839]">
                        {sub.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECTION B: FILES & DOCUMENTS */}
        <div>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#3a2800]">
            <span>📄</span>
            <span>الملفات والمستندات</span>
            <span className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-[#8b6508]">
              {productList.length}
            </span>
          </h2>

          {productList.length > 0 ? (
            <div className="card-ceramic overflow-hidden rounded-2xl divide-y divide-[var(--border)]">
              {productList.map((product) => {
                const resolvedFileUrl = getSafeFileUrl(product.file_url);
                const isPaid = product.price && product.price > 0;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">🔗</span>
                      <div>
                        <span className="font-bold text-[#3a2800]">
                          {product.title}
                        </span>
                        {product.short_description && (
                          <p className="mt-1 text-xs text-[#6b5839]">
                            {product.short_description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {isPaid ? (
                        <Link
                          href={`/products/${product.id}`}
                          className="btn-gold-3d rounded-full px-5 py-2 text-xs font-extrabold"
                        >
                          شراء ({product.price} جنيه)
                        </Link>
                      ) : resolvedFileUrl ? (
                        <a
                          href={resolvedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gold-3d rounded-full px-5 py-2 text-xs font-extrabold"
                        >
                          فتح الملف ↗
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-[#8c7a5c]">
                          غير متوفر
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-ceramic rounded-2xl border-dashed p-10 text-center text-sm font-medium text-[#8c7a5c]">
              لا توجد ملفات مرفوعة في هذا القسم حالياً.
            </div>
          )}
        </div>

        {/* SECTION C: BUNDLE CHECKOUT FORM (If bundle price is configured) */}
        {hasBundlePrice && (
          <div id="bundle-checkout" className="card-ceramic rounded-3xl p-8 sm:p-10 border border-[#d4af37]/50 shadow-xl space-y-6">
            <div>
              <span className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-xs font-black text-[#7a5905]">
                شراء باقة التصنيف كاملة 📦
              </span>
              <h3 className="text-2xl font-black text-[#2c220f] mt-2">
                احصل على كافة محتويات "{category.name}" بسعر خاص: {category.bundle_price} جنيه
              </h3>
              <p className="text-xs font-bold text-[#6b5839] mt-1">
                قم بالتحويل عبر إنستا باي واملأ البيانات أدناه ليتم مراجعة طلبك وتفعيله بواسطة الإدارة فوراً.
              </p>
            </div>

            {/* INSTAPAY INSTRUCTIONS */}
            {settings && (
              <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#fffdfa] to-[#f5edcb] p-6 space-y-4">
                <h4 className="text-sm font-black text-[#2c220f]">بيانات التحويل عبر إنستا باي (InstaPay):</h4>
                {settings.instapay_username && (
                  <div className="flex items-center justify-between rounded-xl bg-white/90 p-3 border border-[#d4af37]/20 text-xs font-bold">
                    <span>اسم المستخدم:</span>
                    <span className="text-[#8b6508] font-black select-all text-sm">{settings.instapay_username}</span>
                  </div>
                )}
                {settings.instapay_qr_url && (
                  <div className="flex justify-center pt-2">
                    <Image
                      src={settings.instapay_qr_url}
                      alt="InstaPay QR Code"
                      width={160}
                      height={160}
                      className="rounded-xl border border-[#d4af37]/30 shadow-md bg-white p-2"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ORDER SUBMISSION FORM */}
            <form action={handleBundleOrder} className="space-y-4 pt-4">
              <input type="hidden" name="category_id" value={category.id} />
              <input type="hidden" name="category_name" value={category.name} />
              <input type="hidden" name="bundle_price" value={category.bundle_price!} />

              <div>
                <label className="block mb-2 text-xs font-black text-[#3a2800]">الاسم الكامل</label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  placeholder="أدخل اسمك الكريم"
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-xs font-bold focus:border-[#8b6508] focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-black text-[#3a2800]">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="customer_email"
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-xs font-bold focus:border-[#8b6508] focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-black text-[#3a2800]">رقم الهاتف / واتساب</label>
                <input
                  type="text"
                  name="customer_phone"
                  required
                  placeholder="010xxxxxxxx"
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-xs font-bold focus:border-[#8b6508] focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-black text-[#3a2800]">صورة إيصال التحويل (صورة التحويل من إنستا باي)</label>
                <input
                  type="file"
                  name="payment_proof"
                  accept="image/*"
                  required
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-xs font-bold file:ml-4 file:rounded-xl file:border-0 file:bg-[#d4af37]/20 file:px-4 file:py-2 file:text-xs file:font-black file:text-[#8b6508] shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="btn-gold-3d w-full rounded-2xl py-4 text-sm font-black shadow-lg transition hover:scale-[1.01] mt-2"
              >
                تأكيد وإرسال طلب الباقة 🚀
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}