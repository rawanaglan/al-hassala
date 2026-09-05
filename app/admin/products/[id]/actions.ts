"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";


export async function createOrder(productId: string) {
  const supabase = await createSupabaseServerClient();

  // Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "يجب تسجيل الدخول أولاً.",
    };
  }

  // Get the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, price, is_free, is_published")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return {
      success: false,
      message: "المحتوى غير موجود.",
    };
  }

  if (!product.is_published) {
    return {
      success: false,
      message: "هذا المحتوى غير متاح حالياً.",
    };
  }

  if (product.is_free) {
    return {
      success: false,
      message: "هذا المحتوى مجاني ولا يحتاج إلى عملية شراء.",
    };
  }

  // Check if the user already has access
  const { data: existingAccess } = await supabase
    .from("user_library")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingAccess) {
    return {
      success: false,
      message: "لديك بالفعل صلاحية الوصول لهذا المحتوى.",
    };
  }

  // Create pending order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: product.id,
      total_amount: product.price,
      status: "pending",
      payment_method: "paymob",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return {
      success: false,
      message: orderError?.message || "حدث خطأ أثناء إنشاء الطلب.",
    };
  }

  return {
    success: true,
    orderId: order.id,
    amount: product.price,
  };
}