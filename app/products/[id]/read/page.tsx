import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getSafeFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("file://")) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const cleanPath = url.replace(/^\//, "");
    return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
  }
  return null;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Get the current logged-in user securely using the server client
  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  // 2. Fetch product data from the public database
  const { data: product, error } = await supabase
    .from("products")
    .select("id, title, short_description, description, price, cover_image_url, file_url")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  // 3. Check if this specific user has an active entry in user_library
  let hasAccess = false;
  if (user) {
    const { data: libraryItem } = await supabaseServer
      .from("user_library")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (libraryItem) {
      hasAccess = true;
    }
  }

  // 4. CRITICAL: Only resolve the file URL if they explicitly have access in their library
  const resolvedFileUrl = hasAccess ? getSafeFileUrl(product.file_url) : null;
  const isPaid = product.price !== null && product.price > 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] px-6 py-12 lg:px-10"
    >
      {/* Top Back Navigation / Breadcrumb */}
      <div className="mx-auto max-w-4xl mb-6">
        <BackButton label="العودة للخلف" />
      </div>

      <div className="card-ceramic mx-auto max-w-4xl rounded-3xl p-8 sm:p-10 shadow-lg">
        {/* Cover Image / Placeholder */}
        <div className="mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#fbf7f0] flex items-center justify-center">
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#8c6d31]">
              <span className="text-5xl">📁</span>
              <span className="text-xs font-bold tracking-widest uppercase">الحصالة</span>
            </div>
          )}
        </div>

        {/* Header Details */}
        <div className="mb-6 border-b border-[#d4af37]/20 pb-6">
          <h1 className="text-3xl font-black text-[#2c220f] sm:text-4xl mb-3">
            {product.title}
          </h1>
          {product.short_description && (
            <p className="text-base font-medium leading-8 text-[#6e5422]">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="mb-8 text-[#5c4010] text-base leading-8 font-medium whitespace-pre-line">
            {product.description}
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#d4af37]/20 pt-6">
          <div className="text-2xl font-black text-[#8b6508]">
            {isPaid ? `${product.price} جنيه` : "مجاني"}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {hasAccess && resolvedFileUrl ? (
              /* Show Read/Open button ONLY if they have valid library access */
              <a
                href={resolvedFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-3d w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold"
              >
                قراءة / فتح الملف ↗
              </a>
            ) : isPaid ? (
              /* Show Buy button if it's a paid product they don't own */
              <button className="btn-gold-3d w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold">
                ادفع الآن ({product.price} جنيه)
              </button>
            ) : (
              /* Access Revoked / Missing Message */
              <div className="text-right">
                <span className="text-sm font-bold text-red-600 block">
                  ليس لديك صلاحية وصول لهذا الملف حالياً.
                </span>
                <span className="text-xs text-[#8c6d31] block mt-1">
                  تمت إزالة صلاحية الوصول من حسابك بواسطة الإدارة.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}