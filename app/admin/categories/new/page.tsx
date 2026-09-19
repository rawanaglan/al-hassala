import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  bundle_price: number | null;
  image_url: string | null;
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
    .select("id, name, description, parent_id, bundle_price, image_url")
    .order("name", { ascending: true });

  const allCategories = (catList || []) as Category[];

  // 2. Fetch the specific category to populate input fields if editing
  let existingCat: Category | null = null;
  if (editId) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, description, parent_id, bundle_price, image_url")
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
    const imageUrlInput = formData.get("image_url") as string;
    const imageFile = formData.get("image_file") as File | null;

    let finalImageUrl = imageUrlInput?.trim() || existingCat?.image_url || null;

    // Handle file upload if a new cover photo file is provided
    if (imageFile && imageFile.size > 0) {
      const fileName = `category-${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, imageFile);

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(uploadData.path);
        
        finalImageUrl = publicUrlData.publicUrl;
      } else if (uploadError) {
        console.error("Storage upload error:", uploadError.message);
      }
    }

    const payload = {
      name: name.trim(),
      description: description?.trim() || null,
      parent_id: parentId || null,
      bundle_price: bundlePrice ? parseFloat(bundlePrice) : null,
      image_url: finalImageUrl,
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
    <main dir="rtl" className="min-h-screen text-[var(--foreground)] bg-[#faf9f6] p-6 lg:p-10 text-[#2c220f]">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <div>
            <BackButton label="العودة للتصنيفات" />
          </div>
          <div>
            <h1 className="text-gold-gradient mt-2 text-3xl font-black">
              {editId ? `تعديل التصنيف: ${existingCat?.name || ""}` : "إضافة تصنيف جديد"}
            </h1>
          </div>
        </div>

        <form action={handleSaveCategory} className="card-ceramic rounded-3xl border border-[#d4af37]/30 bg-white p-8 shadow-xl space-y-6">
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

          {/* PARENT CATEGORY DROPDOWN */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              مكانه في المكتبة (التصنيف الرئيسي)
            </label>
            <select
              name="parent_id"
              defaultValue={existingCat?.parent_id || defaultParentId || ""}
              className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-3 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
            >
              <option value="">تصنيف رئيسي (بدون أب - Parent Category)</option>
              {allCategories
                .filter((c) => c.id !== editId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (تصنيف فرعي تحت هذا القسم)
                  </option>
                ))}
            </select>
          </div>

          {/* COVER PHOTO */}
          <div className="space-y-3">
            <label className="block mb-2 text-sm font-bold text-[#3a2800]">
              صورة الغلاف (Cover Photo)
            </label>

            {existingCat?.image_url && (
              <div className="flex items-center gap-4 p-3 rounded-2xl border border-[#d4af37]/30 bg-[#faf9f6]">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[#d4af37]/40 shrink-0">
                  <Image src={existingCat.image_url} alt="Cover Preview" fill className="object-cover" />
                </div>
                <div className="text-xs font-semibold text-[#8c6d31]">
                  الصورة الحالية مسجلة. يمكنك رفع صورة جديدة أو تعديل الرابط أدناه لاستبدالها.
                </div>
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#8c6d31] mb-1">رفع ملف صورة الغلاف</label>
                <input
                  type="file"
                  name="image_file"
                  accept="image/*"
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-3 py-2 text-xs font-medium file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#d4af37]/20 file:text-[#5c4010]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8c6d31] mb-1">أو رابط الصورة مباشرة (URL)</label>
                <input
                  type="url"
                  name="image_url"
                  defaultValue={existingCat?.image_url || ""}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-2.5 text-sm font-medium focus:border-[#8b6508] focus:outline-none"
                />
              </div>
            </div>
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
              className="rounded-full bg-[#d4af37] px-8 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#b3922b]"
            >
              {editId ? "حفظ التعديلات" : "حفظ التصنيف"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}