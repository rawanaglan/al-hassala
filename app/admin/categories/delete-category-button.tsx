"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  categoryId: string;
  categoryName: string;
};

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
}: Props) {
  const router = useRouter();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    // Check whether products still belong to this category
    const { count, error: productsError } = await supabase
      .from("products")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("category_id", categoryId);

    if (productsError) {
      setError("حدث خطأ أثناء التحقق من المحتوى.");
      setDeleting(false);
      return;
    }

    if ((count || 0) > 0) {
      setError(
        `لا يمكن حذف هذا التصنيف لأنه يحتوي على ${count} محتوى. انقل المحتوى إلى تصنيف آخر أولاً.`
      );
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (deleteError) {
      setError("حدث خطأ أثناء حذف التصنيف.");
      setDeleting(false);
      return;
    }

    setShowConfirmation(false);
    setDeleting(false);

    router.refresh();
  }

  return (
    <>
      {/* DELETE BUTTON */}
      <button
        type="button"
        onClick={() => {
          setError("");
          setShowConfirmation(true);
        }}
        className="rounded-lg border border-red-500/20 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/[0.06] hover:text-red-300"
      >
        حذف
      </button>

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div
            dir="rtl"
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-7 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.06]">
              <span className="text-lg text-red-400">!</span>
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              حذف التصنيف؟
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              هل أنت متأكد أنك تريد حذف التصنيف:
            </p>

            <p className="mt-2 font-medium text-white">
              {categoryName}
            </p>

            <p className="mt-4 text-xs leading-6 text-gray-600">
              لا يمكن التراجع عن هذا الإجراء.
            </p>

            {/* ERROR */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                <p className="text-sm leading-6 text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmation(false);
                  setError("");
                }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}