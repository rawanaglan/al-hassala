import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  category_type: string | null;
  bundle_price: number | null;
};

type PageProps = {
  searchParams: Promise<{
    edit?: string;
    parent_id?: string;
  }>;
};

export default async function CategoryFormPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const editId = params.edit;
  const defaultParentId = params.parent_id || null;

  // 1. Fetch all categories for the parent select dropdown
  const { data: catList } = await supabase
    .from("categories")
    .select("id, name, description, parent_id, category_type, bundle_price")
    .order("name", { ascending: true });

  const allCategories = (catList || []) as Category[];

  // 2. Fetch the specific category to populate input fields if editing
  let existingCat: Category | null = null;
  if (editId) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, description, parent_id, category_type, bundle_price")
      .eq("id", editId)
      .maybeSingle();

    if (data) {
      existingCat = data as Category;
    }
  }

  // 3. Server Action to submit update or insert to Supabase
  async function handleSaveCategory(formData: FormData) {
    "use server";

    const categoryId = formData.get("categoryId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const parentId = formData.get("parent_id") as string;
    const bundlePrice = formData.get("bundle_price") as string;

    const payload = {
      name: name.trim(),
      description: description?.trim() || null,
      parent_id: parentId || null,
      bundle_price: bundlePrice ? parseFloat(bundlePrice) : null,
    };

    if (categoryId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", categoryId);
      if (error) {
        console.error("Error updating category:", error.message);
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("categories").insert([payload]);
      if (error) {
        console.error("Error inserting category:", error.message);
        throw new Error(error.message);
      }
    }

    redirect("/admin/categories");
  }

  return (
    <main dir="rtl" className="min-h-screen text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 space-y-4">
          <div>
            <BackButton label="العودة للتصنيفات" />
          </div>
          <div>
            <h1 className="text-gold-gradient mt-2 text-2xl font-bold">
              {editId ? `تعديل التصنيف: ${existingCat?.name || ""}` : "إضافة تصنيف جديد"}
            </h1>
          </div>
        </div>

        <form action={handleSaveCategory} className="card-ceramic rounded-3xl p-8 space-y-6">
          <input type="hidden" name="categoryId" value={editId || ""} />

          {/* NAME */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              اسم التصنيف
            </label>
            <input
              type="text"
              name="name"
              defaultValue={existingCat?.name || ""}
              placeholder="مثال: مهارات العمل"
              required
              className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
            />
          </div>

          {/* BUNDLE PRICE */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              سعر باقة التصنيف (اختياري - يتيح شراء جميع محتويات التصنيف دفعة واحدة)
            </label>
            <input
              type="number"
              step="0.01"
              name="bundle_price"
              defaultValue={existingCat?.bundle_price || ""}
              placeholder="مثال: 150 (اتركه فارغاً إذا لم توجد باقة)"
              className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              وصف التصنيف
            </label>
            <textarea
              rows={4}
              name="description"
              defaultValue={existingCat?.description || ""}
              placeholder="اكتب وصفاً مختصراً لهذا التصنيف..."
              className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
            />
          </div>

          {/* PARENT CATEGORY */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              التصنيف الرئيسي
            </label>
            <select
              name="parent_id"
              defaultValue={existingCat?.parent_id || defaultParentId || ""}
              className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
            >
              <option value="">تصنيف رئيسي (بدون أب)</option>
              {allCategories
                .filter((c) => c.id !== editId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Link
              href="/admin/categories"
              className="rounded-full border border-[#d4af37]/40 px-6 py-2.5 text-xs font-bold text-[#6b5839]"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              className="btn-gold-3d rounded-full px-8 py-2.5 text-xs font-bold"
            >
              {editId ? "حفظ التعديلات" : "حفظ التصنيف"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}