"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function grantAccess(
  userId: string,
  productId: string,
  accessType: string
) {
  const supabase = await createSupabaseServerClient();

  // Check if access already exists
  const { data: existingAccess } = await supabase
    .from("user_library")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingAccess) {
    return {
      success: false,
      message: "هذا المستخدم لديه صلاحية وصول لهذا المحتوى بالفعل.",
    };
  }

  // Grant access
  const { error } = await supabase
    .from("user_library")
    .insert({
      user_id: userId,
      product_id: productId,
      access_type: accessType,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/users/${userId}`);

  return {
    success: true,
    message: "تم منح صلاحية الوصول بنجاح.",
  };
}

export async function removeAccess(
  userId: string,
  productId: string
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("user_library")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/users/${userId}`);

  return {
    success: true,
    message: "تم إزالة صلاحية الوصول بنجاح.",
  };
}