import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch all products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Server action to delete a product
  async function deleteProduct(formData: FormData) {
    "use server";
    const productId = formData.get("id") as string;
    const supabaseServer = await createSupabaseServerClient();

    await supabaseServer.from("products").delete().eq("id", productId);
    revalidatePath("/admin/products");
  }

  return (
    <div className="min-h-screen text-[var(--foreground)] p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-6">
          
          {/* Back Link pointing to Admin Dashboard */}
          <div className="mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--border)] bg-white/60 text-[#6b5839] hover:bg-black/[0.03] hover:text-[#3a2800] rounded-lg text-xs font-bold transition"
            >
              ← لوحة التحكم
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gold-gradient text-3xl font-extrabold tracking-tight">
                إدارة المحتوى والمنتجات
              </h1>
              <p className="text-sm font-medium text-[#6b5839] mt-1">
                عرض، تعديل، وحذف جميع المنتجات والموارد في المكتبة
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="btn-gold-3d rounded-xl px-5 py-2.5 text-sm font-extrabold"
            >
              + إضافة منتج جديد
            </Link>
          </div>
        </div>

        {/* Products Table */}
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
            حدث خطأ أثناء تحميل المنتجات.
          </div>
        ) : !products || products.length === 0 ? (
          <div className="card-ceramic text-center py-12 text-[#8c7a5c] rounded-2xl font-medium border-dashed">
            لا توجد منتجات حالياً.
          </div>
        ) : (
          <div className="card-ceramic overflow-x-auto rounded-2xl">
            <table className="w-full text-right text-sm text-[#3a2800]">
              <thead className="bg-[#f5ebd7]/50 text-[#8b6508] font-bold uppercase border-b border-[var(--border)]">
                <tr>
                  <th scope="col" className="px-6 py-4">اسم المنتج</th>
                  <th scope="col" className="px-6 py-4">السعر</th>
                  <th scope="col" className="px-6 py-4">الحالة</th>
                  <th scope="col" className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-black/[0.02] transition">
                    <td className="px-6 py-4 font-bold text-[#3a2800]">
                      {product.title || product.name || "منتج بدون عنوان"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#6b5839]">
                      {product.price ? `${product.price} جنيه` : "مجاني"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        منشور
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-block px-3 py-1.5 border border-[var(--border)] bg-white/60 text-[#6b5839] hover:bg-black/[0.03] hover:text-[#3a2800] rounded-lg text-xs font-bold transition"
                      >
                        تعديل
                      </Link>
                      <form action={deleteProduct} className="inline-block">
                        <input type="hidden" name="id" value={product.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition"
                        >
                          حذف
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}