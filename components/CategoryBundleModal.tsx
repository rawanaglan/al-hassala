"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type Props = {
  categoryId: string;
  categoryName: string;
  bundlePrice: number;
  bundleId?: string | null;
};

export default function CategoryBundleModal({
  categoryId,
  categoryName,
  bundlePrice,
  bundleId,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedBundleId, setResolvedBundleId] = useState<string | null>(bundleId || null);
  const [accessStatus, setAccessStatus] = useState<"none" | "pending" | "approved">("none");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchCategoryBundle() {
      if (bundleId) {
        setResolvedBundleId(bundleId);
        return;
      }

      const { data } = await supabase
        .from("category_bundles")
        .select("id")
        .eq("category_id", categoryId)
        .maybeSingle();

      if (data) {
        setResolvedBundleId(data.id);
      }
    }

    if (isModalOpen) {
      fetchCategoryBundle();
    }
  }, [isModalOpen, categoryId, bundleId]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (user.email) setUserEmail(user.email);
      }

      const activeEmail = user?.email || localStorage.getItem("user_email");
      if (activeEmail && resolvedBundleId) {
        setUserEmail(activeEmail);
        const { data: reqData } = await supabase
          .from("access_requests")
          .select("status")
          .eq("product_id", resolvedBundleId)
          .eq("user_email", activeEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reqData) {
          setAccessStatus(reqData.status as "pending" | "approved");
        }
      }
    }
    if (isModalOpen) {
      init();
    }
  }, [isModalOpen, resolvedBundleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userEmail) return alert("برجاء إدخال كافة البيانات والإيصال");
    if (!resolvedBundleId) {
      return alert("خطأ: لم يتم العثور على سجل الباقة لهذا القسم في قاعدة البيانات.");
    }

    setSubmitting(true);
    try {
      localStorage.setItem("user_email", userEmail);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from("receipts")
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      const receiptUrl = publicUrlData.publicUrl;

      const { error: dbErr } = await supabase.from("access_requests").insert({
        product_id: resolvedBundleId,
        user_id: currentUserId,
        user_name: userName,
        user_email: userEmail,
        receipt_url: receiptUrl,
        status: "pending",
      });

      if (dbErr) throw dbErr;

      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          subject: `طلب وصول لباقة التصنيف: ${categoryName}`,
          message: `قام المستخدم ${userName} بطلب باقة التصنيف "${categoryName}" وإرفاق إيصال الدفع. <br/><br/><a href="${receiptUrl}" target="_blank">عرض الإيصال المرفق ↗</a>`,
          type: "متجر / طلب وصول باقة تصنيف"
        }),
      });

      setAccessStatus("pending");
      setIsModalOpen(false);
      alert("تم إرسال طلبك بنجاح وفي انتظار مراجعة الإدارة!");
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-gold-3d rounded-xl px-6 py-3 text-xs font-bold shadow-md"
      >
        {accessStatus === "approved"
          ? "الباقة مفعلة لديك ✓"
          : accessStatus === "pending"
          ? "الطلب قيد المراجعة ⏳"
          : `شراء الباقة (${bundlePrice} جنيه)`}
      </button>

      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#2c220f]/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="card-ceramic relative w-full max-w-lg rounded-[2.5rem] p-8 sm:p-10 text-right shadow-2xl bg-white my-8 border-2 border-[#d4af37]/40">
            <h2 className="text-gold-gradient text-2xl font-black">الدفع عبر InstaPay</h2>
            <p className="mt-1 text-xs text-[#8c6d31]">باقة تصنيف: {categoryName}</p>

            <div className="my-5 rounded-2xl border border-[#d4af37]/40 bg-[#fbf7f0] p-5 text-center shadow-inner flex flex-col items-center">
              <p className="text-sm font-bold text-[#6e5422] mb-3">
                قم بتحويل <span className="text-[#8b6508]">{bundlePrice} جنيه</span> باستخدام الكود أو الرابط التالي:
              </p>
              
              {/* QR Code Image - make sure to place your downloaded QR image in the public folder as instapay-qr.png */}
              <div className="relative w-48 h-48 mb-4 bg-white p-2 rounded-xl border border-[#d4af37]/30 shadow-sm">
                <Image 
                  src="/instapay-qr.png" 
                  alt="InstaPay QR Code" 
                  fill 
                  className="object-contain rounded-lg"
                />
              </div>

              <a 
                href="https://ipn.eg/S/walied120/instapay/3Oi2kt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#8b6508] hover:underline break-all"
              >
                Click the link to send money to walied120@instapay
              </a>
              <span className="text-[10px] text-[#8c6d31] mt-1">Powered by InstaPay</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#8c6d31]">الاسم</label>
                <input
                  type="text"
                  required
                  placeholder="اسمك الكامل"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl border border-[#d4af37]/40 bg-white/90 p-3 text-sm font-semibold text-[#2c220f] outline-none transition focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#8c6d31]">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="بريدك الإلكتروني"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#d4af37]/40 bg-white/90 p-3 text-sm font-semibold text-[#2c220f] outline-none transition focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#8c6d31]">إيصال التحويل</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-semibold text-[#8c6d31] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fbf7f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#8b6508]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#d4af37]/40 bg-[#fbf7f0] px-5 py-2.5 text-xs font-bold text-[#8b6508]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold-3d rounded-xl px-6 py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال الإيصال"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}