"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type AccessRequest = {
  id: string;
  user_name: string;
  user_email: string;
  user_id: string | null;
  product_id: string;
  receipt_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [titlesMap, setTitlesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch requests without foreign-key joins to avoid dropping bundle requests
    const { data: reqData, error: reqError } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (reqError) {
      console.error("Error fetching requests:", reqError.message);
    }

    // 2. Fetch all products and category bundles to map their titles cleanly
    const [productsRes, bundlesRes] = await Promise.all([
      supabase.from("products").select("id, title"),
      supabase.from("category_bundles").select("id, title"),
    ]);

    const map: Record<string, string> = {};
    productsRes.data?.forEach((p) => {
      map[p.id] = p.title;
    });
    bundlesRes.data?.forEach((b) => {
      map[b.id] = b.title; // Bundle title fallback
    });

    setTitlesMap(map);
    if (reqData) {
      setRequests(reqData);
    }
    setLoading(false);
  };

  const handleApprove = async (req: AccessRequest) => {
    setProcessingId(req.id);
    try {
      // 1. Update access_requests status to "approved"
      const { error: reqErr } = await supabase
        .from("access_requests")
        .update({ status: "approved" })
        .eq("id", req.id);

      if (reqErr) throw reqErr;

      // 2. Identify the user ID (from column or lookup by email)
      let targetUserId = req.user_id;

      if (!targetUserId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", req.user_email)
          .maybeSingle();

        if (profileData) {
          targetUserId = profileData.id;
        }
      }

      if (targetUserId) {
        // 3. Check if this product_id is actually a category bundle
        const { data: bundleData } = await supabase
          .from("category_bundles")
          .select("id")
          .eq("id", req.product_id)
          .maybeSingle();

        if (bundleData) {
          // It's a bundle: Fetch all products belonging to this bundle and grant access to each
          const { data: bundleProducts } = await supabase
            .from("category_bundle_products")
            .select("product_id")
            .eq("bundle_id", req.product_id);

          if (bundleProducts && bundleProducts.length > 0) {
            const upsertPayload = bundleProducts.map((bp) => ({
              user_id: targetUserId,
              product_id: bp.product_id,
              access_type: "purchased",
            }));

            const { error: libErr } = await supabase
              .from("user_library")
              .upsert(upsertPayload, { onConflict: "user_id,product_id" });

            if (libErr) throw libErr;
          }
        } else {
          // It's a regular standalone product
          const { error: libErr } = await supabase.from("user_library").upsert(
            {
              user_id: targetUserId,
              product_id: req.product_id,
              access_type: "purchased",
            },
            { onConflict: "user_id,product_id" }
          );

          if (libErr) throw libErr;
        }

        alert("تم قبول الطلب وإضافة المحتوى إلى مكتبة المستخدم بنجاح!");
      } else {
        alert("تم قبول الطلب، ولكن لم يتم العثور على حساب مسجل بهذا البريد لإضافة المحتوى للمكتبة.");
      }

      fetchData();
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center p-8 text-sm font-bold text-[#8b6508]">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-[var(--foreground)] p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* HEADER */}
        <div className="border-b border-[var(--border)] pb-6">
          <div className="mb-4">
            <BackButton label="العودة" />
          </div>

          <p className="text-xs font-bold tracking-[0.25em] text-[#8b6508]">لوحة التحكم</p>
          <h1 className="text-gold-gradient mt-2 text-3xl font-extrabold tracking-tight">
            طلبات الوصول (InstaPay)
          </h1>
          <p className="mt-1 text-sm font-medium text-[#6b5839]">
            مراجعة وتأكيد إيصالات التحويل وإضافة المنتجات لمكتبات المستخدمين
          </p>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="card-ceramic text-center py-12 text-[#8c7a5c] rounded-2xl font-medium border-dashed">
              لا توجد طلبات حالياً.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="card-ceramic flex flex-col items-start justify-between gap-4 rounded-2xl p-6 transition hover:shadow-md md:flex-row md:items-center"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#3a2800]">
                    {titlesMap[req.product_id] || "منتج أو باقة غير معروفة"}
                  </h3>
                  <p className="text-sm font-semibold text-[#6b5839]">الاسم: {req.user_name}</p>
                  <p className="text-sm font-semibold text-[#6b5839]">البريد: {req.user_email}</p>
                  <Link
                    href={req.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#8b6508] underline decoration-[#c59b27]/40 underline-offset-4 hover:text-[#3a2800]"
                  >
                    عرض الإيصال ↗
                  </Link>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold border ${
                      req.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : req.status === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {req.status === "approved"
                      ? "مقبول"
                      : req.status === "rejected"
                      ? "مرفوض"
                      : "قيد المراجعة"}
                  </span>

                  {req.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className="btn-gold-3d rounded-xl px-4 py-2 text-xs font-extrabold disabled:opacity-50"
                      >
                        موافقة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}