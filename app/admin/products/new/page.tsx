"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
};

type ContentSourceType = "file" | "image" | "video" | "link";

export default function NewProductPage() {
  const router = useRouter();

  // ============================================================
  // FORM STATE
  // ============================================================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("ebook");

  // Content Source Switcher
  const [sourceType, setSourceType] = useState<ContentSourceType>("file");
  const [externalUrl, setExternalUrl] = useState("");

  // New Explanatory Video State
  const [explanationVideoUrl, setExplanationVideoUrl] = useState("");

  // Nested Category State
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // ============================================================
  // DATA
  // ============================================================
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // ============================================================
  // UI STATE
  // ============================================================
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD ALL CATEGORIES (FLAT TREE)
  // ============================================================
  useEffect(() => {
    async function loadAllCategories() {
      setLoadingCategories(true);
      setError("");

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("name");

      if (error) {
        console.error("Categories error:", error.message);
        setError(`فشل تحميل التصنيفات: ${error.message}`);
      } else {
        setAllCategories(data ?? []);
      }

      setLoadingCategories(false);
    }

    loadAllCategories();
  }, []);

  // ============================================================
  // BUILD HIERARCHICAL PATHS FOR CATEGORIES
  // ============================================================
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    allCategories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [allCategories]);

  function getCategoryPath(categoryId: string): string {
    const names: string[] = [];
    let currentId: string | null | undefined = categoryId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = categoryMap.get(currentId);
      if (!cat) break;
      names.unshift(cat.name);
      currentId = cat.parent_id;
    }

    return names.join(" / ");
  }

  const formattedCategories = useMemo(() => {
    return allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      path: getCategoryPath(cat.id),
    }));
  }, [allCategories, categoryMap]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return formattedCategories;
    const query = categorySearchQuery.toLowerCase();
    return formattedCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.path.toLowerCase().includes(query)
    );
  }, [formattedCategories, categorySearchQuery]);

  const selectedCategoryObject = categoryMap.get(selectedCategoryId);

  // ============================================================
  // STORAGE UPLOAD HELPER
  // ============================================================
  async function uploadFileToStorage(selectedFile: File, folder: string): Promise<string> {
    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "bin";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("library-files")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`فشل رفع الملف: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("library-files")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("تعذر الحصول على رابط الملف.");
    }

    return data.publicUrl;
  }

  // ============================================================
  // SUBMIT NEW PRODUCT
  // ============================================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!selectedCategoryId) {
        throw new Error("يرجى اختيار المجلد أو التصنيف المستهدف للمحتوى.");
      }

      if ((sourceType === "file" || sourceType === "image") && !file) {
        throw new Error("يرجى اختيار الملف المراد رفعه.");
      }

      if ((sourceType === "video" || sourceType === "link") && !externalUrl.trim()) {
        throw new Error("يرجى إدخال الرابط الخارجي الصحيح.");
      }

      let fileUrl: string | null = null;
      if (sourceType === "video" || sourceType === "link") {
        fileUrl = externalUrl.trim();
      } else if (file) {
        setSuccess("جاري رفع الملف...");
        const folder = sourceType === "image" ? "images" : "resources";
        fileUrl = await uploadFileToStorage(file, folder);
      }

      let coverUrl: string | null = null;
      if (coverImage) {
        setSuccess("جاري رفع صورة الغلاف...");
        coverUrl = await uploadFileToStorage(coverImage, "covers");
      }

      setSuccess("جاري حفظ المحتوى الجديد...");

      const generatedCode = `PRD-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: insertError } = await supabase.from("products").insert([
        {
          title,
          code: generatedCode,
          short_description: shortDescription || null,
          description: description || null,
          price: isFree ? 0 : Number(price) || 0,
          product_type: productType,
          source_type: sourceType,
          category_id: selectedCategoryId,
          file_url: fileUrl,
          cover_image_url: coverUrl,
          explanation_video_url: explanationVideoUrl.trim() || null, // Saved to your DB table
          is_free: isFree,
          is_published: isPublished,
        },
      ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess("تم إضافة المحتوى بنجاح ✓");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#FAF8F5] text-stone-800">
      {/* HEADER */}
      <header className="border-b border-[#E8DFD1] bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div>
            <BackButton />
            <h1 className="mt-2 text-3xl font-bold text-stone-900">
              إضافة محتوى جديد
            </h1>
            <p className="mt-1 text-sm text-stone-500">إضافة مورد أو كتاب جديد إلى المكتبة.</p>
          </div>
        </div>
      </header>

      {/* FORM SECTION */}
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BASIC INFO */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              المعلومات الأساسية
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-600">عنوان المحتوى *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="أدخل عنوان المحتوى..."
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-600">نوع المحتوى</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                >
                  <option value="ebook">كتاب إلكتروني</option>
                  <option value="guide">دليل</option>
                  <option value="article">مقال</option>
                  <option value="template">قالب</option>
                  <option value="course">كورس</option>
                  <option value="resource">مورد</option>
                  <option value="فيديو">فيديو</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-600">الوصف المختصر</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-600">الوصف الكامل</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="mt-2 w-full resize-none rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* CATEGORY SELECTOR TREE */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8 relative">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              مسار المحتوى (المجلد / التصنيف)
            </h2>

            <div className="mt-6 relative">
              <label className="text-sm font-medium text-stone-600 mb-2 block">التصنيف أو المجلد المستهدف *</label>
              
              <div
                onClick={() => !loadingCategories && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={`w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-sm font-medium text-stone-900 flex items-center justify-between transition ${
                  loadingCategories ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span>
                  {selectedCategoryId
                    ? getCategoryPath(selectedCategoryId)
                    : loadingCategories ? "جاري تحميل التصنيفات..." : "اختر المجلد أو التصنيف..."}
                </span>
                <span className="text-xs text-amber-700 font-bold">▼</span>
              </div>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-[#E8DFD1] bg-white shadow-xl p-4 max-h-80 overflow-y-auto">
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="ابحث عن مجلد أو تصنيف بالاسم..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-[#E0D7C6] bg-gray-50 px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#D4AF37]"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    {filteredCategories.length === 0 ? (
                      <p className="py-3 text-center text-xs text-gray-500">لا توجد نتائج مطابقة</p>
                    ) : (
                      filteredCategories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearchQuery("");
                          }}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-xs transition ${
                            selectedCategoryId === cat.id
                              ? "bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] text-white font-bold"
                              : "hover:bg-gray-100 text-stone-900"
                          }`}
                        >
                          <div className="font-semibold">{cat.name}</div>
                          <div className={`text-[10px] mt-0.5 ${selectedCategoryId === cat.id ? "text-white/80" : "text-stone-400"}`}>
                            {cat.path}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedCategoryObject && (
              <p className="mt-3 text-xs font-semibold text-amber-700">
                المسار المحدد: {getCategoryPath(selectedCategoryId)}
              </p>
            )}

            <div className="mt-6">
              <label className="text-sm font-medium text-stone-600">السعر بالجنيه</label>
              <input
                type="number"
                value={price}
                disabled={isFree}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37] disabled:opacity-50"
              />
            </div>

            <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => {
                  setIsFree(e.target.checked);
                  if (e.target.checked) setPrice("0");
                }}
                className="h-4 w-4 rounded accent-[#B8860B]"
              />
              هذا المحتوى مجاني
            </label>
          </div>

          {/* FILES & MEDIA SWITCHER */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              الملفات والوسائط الأساسية
            </h2>

            <div className="mt-6 mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { id: "file", label: "ملف (PDF/Doc)" },
                  { id: "image", label: "صورة" },
                  { id: "video", label: "فيديو (رابط)" },
                  { id: "link", label: "رابط خارجي" },
                ] as const
              ).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSourceType(type.id)}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                    sourceType === type.id
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] text-white shadow-sm"
                      : "bg-[#F7F4EE] text-stone-600 hover:bg-[#EFEADF] hover:text-stone-900"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {(sourceType === "file" || sourceType === "image") && (
                <div>
                  <label className="text-sm font-medium text-stone-600">
                    رفع {sourceType === "image" ? "صورة" : "ملف"} المحتوى *
                  </label>
                  <input
                    type="file"
                    accept={sourceType === "image" ? "image/*" : ".pdf,.epub,.doc,.docx,.zip,.rar"}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full cursor-pointer rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] p-3 text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#FAF6ED] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#B8860B]"
                  />
                </div>
              )}

              {(sourceType === "video" || sourceType === "link") && (
                <div>
                  <label className="text-sm font-medium text-stone-600">
                    رابط {sourceType === "video" ? "الفيديو" : "المحتوى الخارجي"} *
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-stone-600">صورة الغلاف (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full cursor-pointer rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] p-3 text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#FAF6ED] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#B8860B]"
                />
              </div>
            </div>
          </div>

          {/* EXPLANATORY VIDEO SECTION (SEPARATE) */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              فيديو توضيحي إضافي (اختياري)
            </h2>
            <p className="mt-2 text-xs text-stone-500">
              أضف رابط فيديو (مثل يوتيوب أو فيميو) لشرح المنتج أو التوسع في محتواه للمستخدمين.
            </p>

            <div className="mt-4">
              <label className="text-sm font-medium text-stone-600">رابط الفيديو التوضيحي</label>
              <input
                type="url"
                value={explanationVideoUrl}
                onChange={(e) => setExplanationVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* PUBLISHING STATUS */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              حالة النشر
            </h2>
            <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded accent-[#B8860B]"
              />
              نشر المحتوى على المكتبة فور الإضافة
            </label>
          </div>

          {/* FEEDBACK MESSAGES */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF6ED] p-4 text-sm text-[#8B6508]">
              {success}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="rounded-xl border border-[#E0D7C6] bg-white px-6 py-3 text-sm font-medium text-stone-600 transition hover:bg-[#FAF8F5]"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] px-8 py-4 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "حفظ وإنشاء المحتوى"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}