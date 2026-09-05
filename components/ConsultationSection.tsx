"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CONSULTATION_TIERS = [
  { duration: 15, label: "استشارة سريعة (15 دقيقة)", price: 150 },
  { duration: 30, label: "استشارة قياسية (30 دقيقة)", price: 250 },
  { duration: 60, label: "استشارة مكثفة (ساعة كاملة)", price: 400 },
];

type Tier = typeof CONSULTATION_TIERS[number];

export default function ConsultationSection() {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleOpenModal = (tier: Tier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userEmail || !selectedTier) return alert("برجاء إدخال البريد الإلكتروني وإيصال التحويل");

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `consultation_${Date.now()}_${Math.random()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from("receipts").upload(fileName, file);
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
      const receiptUrl = publicUrlData.publicUrl;

      const { error: dbErr } = await supabase.from("consultations").insert({
        user_name: userName,
        user_email: userEmail,
        duration_minutes: selectedTier.duration,
        price: selectedTier.price,
        receipt_url: receiptUrl,
        status: "pending",
      });

      if (dbErr) throw dbErr;

      setSuccess(true);
      setIsModalOpen(false);
      setUserName("");
      setUserEmail("");
      setFile(null);
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#2c220f]">اختر باقة الاستشارة</h2>

      {/* Grid containing cards, each with its own action button */}
      <div className="grid gap-6 sm:grid-cols-3">
        {CONSULTATION_TIERS.map((tier) => (
          <div
            key={tier.duration}
            className="card-ceramic flex flex-col justify-between rounded-3xl p-6 transition-all border border-[#d4af37]/30 bg-[#fbf7f0] shadow-md hover:shadow-xl"
          >
            <div className="space-y-3 text-center sm:text-right">
              <h3 className="text-lg font-bold text-[#5c4010]">{tier.label}</h3>
              <p className="text-3xl font-black text-[#8b6508]">{tier.price} جنيه</p>
            </div>

            <button
              onClick={() => handleOpenModal(tier)}
              className="btn-gold-3d mt-6 w-full rounded-xl py-3 text-xs font-bold shadow-sm"
            >
              احجز الآن ({tier.price} جنيه)
            </button>
          </div>
        ))}
      </div>

      {success && (
        <p className="text-sm font-bold text-green-600 text-center">تم إرسال طلب الاستشارة بنجاح وسيتم التواصل معك قريباً!</p>
      )}

      {/* Modal for payment checkout */}
      {isModalOpen && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c220f]/40 backdrop-blur-sm p-4">
          <div className="card-ceramic w-full max-w-md rounded-3xl p-8 text-right shadow-2xl bg-white">
            <h2 className="text-2xl font-black text-[#2c220f] mb-2">الدفع عبر InstaPay</h2>
            <p className="text-xs font-semibold text-[#8c6d31] mb-4">
              أنت على وشك حجز: <span className="font-bold text-[#8b6508]">{selectedTier.label}</span>
            </p>
            
            <div className="my-4 rounded-2xl border border-[#d4af37]/40 bg-[#fbf7f0] p-4 text-center shadow-inner">
              <p className="text-xs font-bold text-[#6e5422]">
                قم بتحويل <span className="text-[#8b6508] font-black">{selectedTier.price} جنيه</span> إلى الرقم:
              </p>
              <p className="mt-1 text-2xl font-black tracking-wider text-[#5c4010]">01156874774</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8c6d31] block mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="اسمك"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl border border-[#d4af37]/30 bg-white p-3 text-xs font-semibold text-[#2c220f] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8c6d31] block mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="بريدك الإلكتروني"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#d4af37]/30 bg-white p-3 text-xs font-semibold text-[#2c220f] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8c6d31] block mb-1">إيصال التحويل</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#8c6d31]"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-[#d4af37]/20">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-[#8b6508]">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-gold-3d px-6 py-2.5 text-xs font-bold rounded-xl">
                  {submitting ? "جاري الإرسال..." : "تأكيد الحجز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}