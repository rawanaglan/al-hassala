"use client";

import { useState } from "react";
import { toggleProductPublished } from "./actions";

type Props = {
  productId: string;
  isPublished: boolean;
};

export default function TogglePublishButton({
  productId,
  isPublished,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);

    const result = await toggleProductPublished(
      productId,
      !isPublished
    );

    setLoading(false);

    if (!result.success) {
      alert(result.message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-gray-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
    >
      {loading
        ? "جاري التحديث..."
        : isPublished
        ? "إلغاء النشر"
        : "نشر"}
    </button>
  );
}