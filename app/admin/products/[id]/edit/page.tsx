"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ContentSourceType = "file" | "image" | "video" | "link";

type Product = {
  id: string;
  title: string;
  code: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  product_type: string;
  source_type?: ContentSourceType | null;
  category_id: string | null;
  subcategory_id?: string | null;
  file_url: string | null;
  cover_image_url: string | null;
  video_url?: string | null; // Added video URL field
  reading_time: number | null;
  page_count: number | null;
  difficulty_level: string | null;
  is_free: boolean;
  is_published: boolean;
};

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
  category_id?: string | null;
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Searchable Category Dropdown State
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Quick Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  // Form States
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("ebook");
  
  // Media & Source Control
  const [sourceType, setSourceType] = useState<ContentSourceType>("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); // Added state for extra video field
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState("");

  const [readingTime, setReadingTime] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [difficulty, setDifficulty] = useState("مبتدئ");
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // LOAD PRODUCT AND ALL CATEGORIES
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const [{ data: productData, error: productError }, { data: categoryData }] =
        await Promise.all([
          supabase
            .from("products")
            .select(`
              id, title, code, short_description, description, price, product_type,
              source_type, category_id, subcategory_id, file_url, cover_image_url, video_url,
              reading_time, page_count, difficulty_level, is_free, is_published
            `)
            .eq("id", id)
            .single(),

          supabase
            .from("categories")
            .select("id, name, parent_id")
            .order("name"),
        ]);

      if (productError || !productData) {
        setError("لم نتمكن من العثور على هذا المحتوى.");
        setLoading(false);
        return;
      }

      setProduct(productData);
      setAllCategories(categoryData || []);

      setTitle(productData.title || "");
      setCode(productData.code || "");
      setShortDescription(productData.short_description || "");
      setDescription(productData.description || "");
      setPrice(
        productData.price !== null && productData.price !== undefined
          ? String(productData.price)
          : ""
      );
      setProductType(productData.product_type || "ebook");
      
      const loadedSourceType = (productData.source_type as ContentSourceType) || "file";
      setSourceType(loadedSourceType);

      if (loadedSourceType === "video" || loadedSourceType === "link") {
        setExternalUrl(productData.file_url || "");
      }

      setVideoUrl(productData.video_url || ""); // Load existing explanation video url

      setSelectedCategoryId(productData.category_id || productData.subcategory_id || "");
      setCurrentCoverUrl(productData.cover_image_url || "");

      setReadingTime(
        productData.reading_time !== null && productData.reading_time !== undefined
          ? String(productData.reading_time)
          : ""
      );
      setPageCount(
        productData.page_count !== null && productData.page_count !== undefined
          ? String(productData.page_count)
          : ""
      );
      setDifficulty(productData.difficulty_level || "مبتدئ");
      setIsFree(!!productData.is_free);
      setIsPublished(!!productData.is_published);

      setLoading(false);
    }

    loadData();
  }, [id]);

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

    while (currentId) {
      const cat = categoryMap.get(currentId);
      if (!cat) break;
      names.unshift(cat.name);
      currentId = cat.parent_id || cat.category_id;
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

  // QUICK CATEGORY CREATION HANDLER
  async function handleQuickCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCreatingCategory(true);
    setCategoryError("");

    try {
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({
          name: newCatName.trim(),
          parent_id: newCatParentId ? newCatParentId : null,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      if (data) {
        setAllCategories((prev) => [...prev, data]);
        setSelectedCategoryId(data.id);
        setIsCategoryModalOpen(false);
        setNewCatName("");
        setNewCatParentId("");
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "تعذر إنشاء التصنيف");
    } finally {
      setCreatingCategory(false);
    }
  }

  // STORAGE UPLOAD HELPER
  async function uploadFile(selectedFile: File, folder: string): Promise<string> {
    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "bin";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("library-files")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`فشل رفع الملف: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("library-files")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("تعذر الحصول على رابط الملف.");
    }

    return data.publicUrl;
  }

  // SUBMIT UPDATE
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      let finalFileUrl = product?.file_url || null;

      if (sourceType === "video" || sourceType === "link") {
        finalFileUrl = externalUrl.trim() || null;
      } else if (newFile) {
        setMessage("جاري رفع الملف الجديد...");
        const folder = sourceType === "image" ? "images" : "resources";
        finalFileUrl = await uploadFile(newFile, folder);
      }

      let finalCoverUrl = currentCoverUrl || null;
      if (newCoverImage) {
        setMessage("جاري رفع صورة الغلاف...");
        finalCoverUrl = await uploadFile(newCoverImage, "covers");
      }

      setMessage("جاري حفظ التعديلات...");

      const { error: updateError } = await supabase
        .from("products")
        .update({
          title,
          code,
          short_description: shortDescription || null,
          description: description || null,
          price: isFree ? 0 : Number(price),
          product_type: productType,
          source_type: sourceType,
          category_id: selectedCategoryId || null,
          subcategory_id: null,
          file_url: finalFileUrl,
          cover_image_url: finalCoverUrl,
          video_url: videoUrl.trim() || null, // Include video_url update here
          reading_time: readingTime ? Number(readingTime) : null,
          page_count: pageCount ? Number(pageCount) : null,
          difficulty_level: difficulty,
          is_free: isFree,
          is_published: isPublished,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMessage("تم حفظ التعديلات بنجاح ✓");

      setTimeout(() => {
        router.replace("/admin/products");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-amber-900">
        <p className="font-medium text-amber-800/60 animate-pulse">جاري تحميل المحتوى...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] px-6 py-20 text-stone-800">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-amber-600">404</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">المحتوى غير موجود</h1>
          <Link
            href="/admin/products"
            className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] px-6 py-3 font-semibold text-white shadow-md transition hover:opacity-90"
          >
            العودة للمحتوى
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#FAF8F5] text-stone-800">
      {/* HEADER */}
      <header className="border-b border-[#E8DFD1] bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div>
            <Link href="/admin/products" className="text-sm text-stone-500 transition hover:text-[#B8860B]">
              ← العودة للمحتوى
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">
              تعديل المحتوى
            </h1>
            <p className="mt-1 text-sm text-stone-500">تعديل معلومات ومحتوى هذا المورد.</p>
          </div>

          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="rounded-xl border border-[#D4AF37]/40 bg-white px-5 py-2.5 text-sm font-medium text-[#B8860B] shadow-sm transition hover:bg-[#FAF6ED] hover:border-[#D4AF37]"
          >
            معاينة المحتوى ↗
          </Link>
        </div>
      </header>

      {/* FORM */}
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BASIC INFORMATION */}
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
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-600">كود المحتوى *</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
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
                  className="mt-2 w-full resize-none rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-600">الوصف الكامل</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  className="mt-2 w-full resize-none rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* SEARCHABLE DEEP CATEGORY / FOLDER TREE SELECTOR */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8 relative">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-4">
              <h2 className="text-xl font-bold text-stone-900">
                مسار المحتوى (المجلد / التصنيف)
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="rounded-lg bg-[#FAF6ED] px-3 py-1.5 text-xs font-semibold text-[#B8860B] transition hover:bg-[#F2ECE1]"
              >
                + إضافة تصنيف جديد
              </button>
            </div>

            <div className="mt-6 relative">
              <label className="text-sm font-medium text-stone-600 mb-2 block">التصنيف أو المجلد المستهدف *</label>
              
              <div
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full cursor-pointer rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-sm font-medium text-stone-900 flex items-center justify-between transition focus:border-[#D4AF37]"
              >
                <span>
                  {selectedCategoryId
                    ? getCategoryPath(selectedCategoryId)
                    : "اختر المجلد أو التصنيف..."}
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
                      <p className="py-3 text-center text-xs text-gray-500">لا توجد نتائج مطابقة للبحث</p>
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
              الملفات والوسائط
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
                    رفع {sourceType === "image" ? "صورة" : "ملف"} جديد (اتركه فارغاً للإبقاء على الملف الحالي)
                  </label>
                  <input
                    type="file"
                    accept={sourceType === "image" ? "image/*" : ".pdf,.epub,.doc,.docx,.zip,.rar"}
                    onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full cursor-pointer rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] p-3 text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#FAF6ED] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#B8860B]"
                  />
                  {product.file_url && (
                    <p className="mt-2 text-xs text-stone-500">
                      الرابط الحالي:{" "}
                      <a href={product.file_url} target="_blank" rel="noopener noreferrer" className="text-[#B8860B] font-medium underline">
                        معاينة الملف ↗
                      </a>
                    </p>
                  )}
                </div>
              )}

              {(sourceType === "video" || sourceType === "link") && (
                <div>
                  <label className="text-sm font-medium text-stone-600">
                    رابط {sourceType === "video" ? "الفيديو" : "المحتوى الخارجي"}
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

              {/* EXTRA EXPLANATION VIDEO URL FIELD */}
              <div>
                <label className="text-sm font-medium text-stone-600">رابط فيديو الشرح التوضيحي (اختياري)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
                <p className="mt-1 text-xs text-stone-400">يمكنك إضافة رابط فيديو من يوتيوب أو منصة أخرى لشرح هذا المحتوى.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-600">تحديث صورة الغلاف</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCoverImage(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full cursor-pointer rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] p-3 text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#FAF6ED] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#B8860B]"
                />
                {currentCoverUrl && (
                  <p className="mt-2 text-xs text-stone-500">
                    صورة الغلاف الحالية:{" "}
                    <a href={currentCoverUrl} target="_blank" rel="noopener noreferrer" className="text-[#B8860B] font-medium underline">
                      عرض ↗
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              تفاصيل المحتوى
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-stone-600">عدد الصفحات</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-600">وقت القراءة بالدقائق</label>
                <input
                  type="number"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-600">مستوى الصعوبة</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-4 py-3 text-stone-900 outline-none transition focus:border-[#D4AF37]"
                >
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                </select>
              </div>
            </div>
          </div>

          {/* PUBLISHING */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-stone-900 border-b border-[#F2ECE1] pb-4">
              حالة المحتوى
            </h2>
            <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded accent-[#B8860B]"
              />
              نشر المحتوى على المكتبة
            </label>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF6ED] p-4 text-sm text-[#8B6508]">
              {message}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/admin/products"
              className="rounded-xl border border-[#E0D7C6] bg-white px-6 py-3 text-sm font-medium text-stone-600 transition hover:bg-[#FAF8F5] hover:text-stone-900"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] px-8 py-4 font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </section>

      {/* QUICK CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 mb-4">إضافة تصنيف أو مجلد جديد</h3>

            <form onSubmit={handleQuickCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">اسم التصنيف *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: البرمجة المتقدمة"
                  required
                  className="w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">التصنيف الأب (اختياري)</label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full rounded-xl border border-[#E0D7C6] bg-[#FDFCF9] px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- تصنيف رئيسي --</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryPath(cat.id)}
                    </option>
                  ))}
                </select>
              </div>

              {categoryError && (
                <p className="text-xs text-red-600">{categoryError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-xl border border-[#E0D7C6] px-4 py-2 text-xs font-medium text-stone-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B58D2B] px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50"
                >
                  {creatingCategory ? "جاري الإنشاء..." : "إنشاء وتحديد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}