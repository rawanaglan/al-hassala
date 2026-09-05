import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import BackButton from "@/components/BackButton";
import RequestAccessButton from "@/components/RequestAccessButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Helper to extract the storage path from a Supabase file URL
function getStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const marker = "/object/public/";
    const signMarker = "/object/sign/";
    if (url.includes(marker)) {
      const parts = url.split(marker);
      return parts[1] ? decodeURIComponent(parts[1].split("?")[0]) : null;
    }
    if (url.includes(signMarker)) {
      const parts = url.split(signMarker);
      return parts[1] ? decodeURIComponent(parts[1].split("?")[0]) : null;
    }
    return url.replace(/^\//, "");
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const cookieStore = await cookies();

  // Create a server-side Supabase client using cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  // 1. Fetch current logged-in user
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch Product data
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) {
    return notFound();
  }

  // 3. Check if user has explicit access via the user_library table
  let hasAccess = false;
  const isFree = !product.price || product.price === 0;

  if (isFree) {
    hasAccess = true;
  } else if (user) {
    const { data: libraryItem } = await supabase
      .from("user_library")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (libraryItem) {
      hasAccess = true;
    }
  }

  // 4. Generate a temporary secure Signed URL if they have access and a file exists
  let resolvedFileUrl: string | null = null;
  if (hasAccess && product.file_url) {
    if (product.file_url.startsWith("http://") || product.file_url.startsWith("https://")) {
      resolvedFileUrl = product.file_url;
    } else {
      const filePath = getStoragePath(product.file_url);
      if (filePath) {
        const { data: signedData } = await supabase.storage
          .from("products")
          .createSignedUrl(filePath, 60);

        if (signedData?.signedUrl) {
          resolvedFileUrl = signedData.signedUrl;
        }
      }
    }
  }

  // Resolve cover image URL safely
  let resolvedCoverUrl: string | null = null;
  if (product.cover_image_url) {
    if (product.cover_image_url.startsWith("http://") || product.cover_image_url.startsWith("https://")) {
      resolvedCoverUrl = product.cover_image_url;
    } else {
      const cleanPath = product.cover_image_url.replace(/^\//, "");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        resolvedCoverUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
      }
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <BackButton label="العودة للخلف" />
        </div>

        <div className="card-ceramic overflow-hidden rounded-3xl p-6 sm:p-10">
          
          {/* Cover Image Display */}
          <div className="relative mb-8 flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#fbf7f0] border border-[#d4af37]/20 shadow-inner sm:h-80">
            {resolvedCoverUrl ? (
              <img
                src={resolvedCoverUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-6xl text-[#d4af37]">📚</span>
            )}
          </div>

          <h1 className="text-gold-gradient text-3xl font-black tracking-tight sm:text-4xl">
            {product.title}
          </h1>

          {product.short_description && (
            <p className="mt-4 text-base leading-8 font-semibold text-[#6e5422]">
              {product.short_description}
            </p>
          )}

          {/* Explanation Video Section */}
          {product.video_url && (
            <div className="mt-8 space-y-3">
              <h3 className="text-lg font-bold text-[#5c4010]">فيديو الشرح التوضيحي</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-black shadow-inner">
                <iframe
                  src={product.video_url.includes("watch?v=") ? product.video_url.replace("watch?v=", "embed/") : product.video_url}
                  title="فيديو الشرح"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {product.description && (
            <div className="mt-6 border-t border-[#d4af37]/20 pt-6 text-sm leading-7 text-[#8c6d31]">
              <p>{product.description}</p>
            </div>
          )}

          {/* Secure Viewer Section */}
          {hasAccess ? (
            resolvedFileUrl ? (
              <div className="mt-8 space-y-4 border-t border-[#d4af37]/30 pt-6">
                <h3 className="text-lg font-bold text-[#5c4010]">محتوى الملف</h3>
                
                <div className="relative h-[75vh] w-full overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-[#fbf7f0] shadow-inner">
                  <iframe
                    src={`${resolvedFileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="h-full w-full border-0"
                    title={product.title}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-10 border-t border-[#d4af37]/30 pt-6">
                <span className="text-sm font-semibold text-[#8c6d31]">الملف غير متوفر حالياً</span>
              </div>
            )
          ) : (
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[#d4af37]/30 pt-6">
              <span className="text-2xl font-black text-[#5c4010]">
                {isFree ? "مجاني" : `${product.price} جنيه`}
              </span>

              <RequestAccessButton
                productId={product.id}
                productTitle={product.title}
                productPrice={product.price}
                userEmail={user?.email || null}
                userId={user?.id || null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}