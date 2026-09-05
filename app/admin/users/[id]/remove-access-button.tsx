"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string;
  productId: string;
  productTitle: string;
};

export default function RemoveAccessButton({ userId, productId, productTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (!confirm(`هل أنت متأكد من إزالة الوصول إلى "${productTitle}"؟`)) {
      return;
    }

    setLoading(true);

    try {
      // 1. Delete the record from user_library table
      const { error } = await supabase
        .from("user_library")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        throw error;
      }

      // 2. Refresh the Next.js server component cache to update UI & counters immediately
      router.refresh();
    } catch (err: any) {
      alert("حدث خطأ أثناء إزالة الوصول: " + (err.message || "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
    >
      {loading ? "جاري الإزالة..." : "إزالة الوصول"}
    </button>
  );
}