"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AccessButtonProps = {
  productId: string;
  isFree: boolean;
  hasAccess?: boolean;
};

export default function AccessButton({
  productId,
  isFree,
  hasAccess = false,
}: AccessButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccess() {
    if (loading) return;

    setLoading(true);
    setError("");

    // Open the tab immediately while we're still inside
    // the user's click event.
    let readerWindow: Window | null = null;

    try {
      // ============================================================
      // USER ALREADY HAS ACCESS
      // ============================================================

      if (hasAccess) {
        window.open(
          `/products/${productId}/read`,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      // ============================================================
      // FREE RESOURCE
      // ============================================================

      if (isFree) {
        // Open a blank tab immediately so the browser doesn't
        // block the popup after the async Supabase requests.
        readerWindow = window.open(
          "about:blank",
          "_blank",
          "noopener,noreferrer"
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // ==========================================================
        // NOT LOGGED IN
        // ==========================================================

        if (!user) {
          readerWindow?.close();

          router.push(
            `/login?redirect=/products/${productId}/read`
          );

          return;
        }

        // ==========================================================
        // CHECK LIBRARY
        // ==========================================================

        const { data: existingItem, error: checkError } =
          await supabase
            .from("user_library")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .maybeSingle();

        if (checkError) {
          console.error("Library check error:", checkError);

          readerWindow?.close();

          setError(
            "حدث خطأ أثناء التحقق من المكتبة."
          );

          return;
        }

        // ==========================================================
        // ADD TO LIBRARY
        // ==========================================================

        if (!existingItem) {
          const { error: insertError } = await supabase
            .from("user_library")
            .insert({
              user_id: user.id,
              product_id: productId,
              access_type: "free",
            });

          if (insertError) {
            console.error(
              "Library insert error:",
              insertError
            );

            readerWindow?.close();

            setError(
              "حدث خطأ أثناء إضافة المحتوى إلى مكتبتك."
            );

            return;
          }
        }

        // ==========================================================
        // OPEN READER
        // ==========================================================

        if (readerWindow) {
          readerWindow.location.href =
            `/products/${productId}/read`;
        }

        return;
      }

      // ============================================================
      // PAID RESOURCE
      // ============================================================

      alert("Payment will be added later.");
    } catch (error) {
      console.error("Access error:", error);

      readerWindow?.close();

      setError(
        "حدث خطأ غير متوقع. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAccess}
        disabled={loading}
        className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Please wait..."
          : hasAccess
          ? "Read Resource"
          : isFree
          ? "Get Access"
          : "Purchase"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}