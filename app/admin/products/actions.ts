"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";

export async function deleteProduct(productId: string) {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  return {
    success: true,
    message: "تم حذف المحتوى بنجاح.",
  };
}
export async function toggleProductPublished(
  productId: string,
  isPublished: boolean
) {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("products")
    .update({
      is_published: isPublished,
    })
    .eq("id", productId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");

  return {
    success: true,
    message: isPublished
      ? "تم نشر المحتوى بنجاح."
      : "تم إلغاء نشر المحتوى بنجاح.",
  };
}