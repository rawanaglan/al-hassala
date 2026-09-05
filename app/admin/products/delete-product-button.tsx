"use client";

import { useState } from "react";
import { deleteProduct } from "./actions";

type Props = {
  productId: string;
  productTitle: string;
};

export default function DeleteProductButton({
  productId,
  productTitle,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    const result = await deleteProduct(productId);

    setLoading(false);

    if (result.success) {
      setShowConfirm(false);
    } else {
      alert(result.message);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-lg border border-red-500/20 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/[0.06]"
      >
        حذف
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div
            dir="rtl"
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-6 shadow-2xl"
          >
            <p className="text-xs tracking-[0.2em] text-gray-600">
              CONFIRM ACTION
            </p>

            <h2 className="mt-3 text-xl font-semibold text-white">
              حذف المحتوى؟
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <p className="mt-3 font-medium text-gray-300">
              {productTitle}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "جاري الحذف..." : "حذف المحتوى"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}