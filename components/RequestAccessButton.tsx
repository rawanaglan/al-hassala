"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  productId: string;
  productTitle: string;
  productPrice: number | null;
  userEmail: string | null;
  userId: string | null;
};

export default function RequestAccessButton({
  productId,
  productTitle,
  productPrice,
  userEmail: initialEmail,
  userId,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState(initialEmail || "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"none" | "pending">("none");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userEmail) return alert("برجاء إدخال البريد الإلكتروني وإيصال التحويل");

    setSubmitting(true);
    try {
      localStorage.setItem("user_email", userEmail);

      // 1. Upload receipt image to Supabase Storage
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

      // 2. Save request row in access_requests table
      const { error: dbErr } = await supabase.from("access_requests").insert({
        product_id: productId,
        user_id: userId || null,
        user_name: userName,
        user_email: userEmail,
        receipt_url: receiptUrl,
        status: "pending",
      });

      if (dbErr) throw dbErr;

      // 3. Send email notification to admin via API route
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          subject: `طلب وصول جديد للمنتج: ${productTitle}`,
          message: `قام المستخدم ${userName} بطلب وصول للمنتج "${productTitle}" وإرفاق إيصال الدفع. يمكنك مراجعة الطلب من لوحة التحكم. <br/><br/><a href="${receiptUrl}" target="_blank">عرض الإيصال المرفق ↗</a>`,
          type: "متجر / طلب وصول منتج",
        }),
      });

      setRequestStatus("pending");
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
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {requestStatus === "pending" && (
          <span className="inline-flex items-center rounded-xl border border-[#d4af37]/40 bg-[#fbf7f0] px-4 py-3 text-xs font-bold text-[#8b6508] shadow-inner">
            ⏳ طلبك الحالي قيد المراجعة
          </span>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-[#d4af37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#c5a030] shadow-md"
        >
          {requestStatus === "pending" ? "إرسال إيصال جديد" : "ادفع عبر InstaPay وطلب الوصول"}
        </button>
      </div>

      {/* PAYMENT & RECEIPT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#141414] p-8 text-right shadow-2xl text-white">
            <h2 className="text-2xl font-black text-[#d4af37]">الدفع عبر InstaPay</h2>
            
            <div className="my-5 rounded-2xl border border-[#d4af37]/30 bg-black/40 p-5 text-center shadow-inner">
              <p className="text-sm font-bold text-gray-300">
                قم بتحويل <span className="text-[#d4af37]">{productPrice} جنيه</span> إلى الرقم التالي:
              </p>
              <p className="mt-2 text-3xl font-black tracking-wider text-white">01156874774</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400">الاسم</label>
                <input
                  type="text"
                  required
                  placeholder="اسمك الكامل"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm font-semibold text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="بريدك الإلكتروني"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm font-semibold text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400">إيصال التحويل</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-semibold text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-gray-300 transition hover:bg-white/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#d4af37] px-6 py-2.5 text-xs font-bold text-black transition hover:bg-[#c5a030] disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال الإيصال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}