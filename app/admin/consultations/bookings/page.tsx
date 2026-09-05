"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type ConsultationBooking = {
  id: string;
  user_name: string;
  user_email: string;
  duration_minutes: number;
  price: number;
  receipt_url: string;
  status: string;
  created_at: string;
};

export default function AdminConsultancyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consultations:", error);
    } else if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, userEmail: string, userName: string) => {
    console.log("Updating status for ID:", id, "to:", newStatus);
    
    const { data, error } = await supabase
      .from("consultations")
      .update({ status: newStatus })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      alert("تعذر تحديث حالة الحجز: " + error.message);
    } else {
      console.log("Successfully updated:", data);
      
      // Immediately update local state
      setBookings((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );

      // Trigger the email notification to the admin inbox for free
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            name: userName || "مستخدم",
            subject: newStatus === "confirmed" ? "تم تأكيد حجز استشارة جديد" : "تم إرجاع حجز إلى قيد الانتظار",
            message: `تم تحديث حالة الحجز للعميل ${userName || "مستخدم"} إلى (${newStatus === "confirmed" ? "مؤكد" : "قيد الانتظار"}).`,
            type: "استشارات / تحديث حالة حجز"
          }),
        });
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
      }

      if (newStatus === "confirmed") {
        alert(`تم تأكيد الحجز وإرسال الإشعار بنجاح!`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;

    console.log("Deleting record ID:", id);

    const { error } = await supabase
      .from("consultations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      alert("تعذر حذف الحجز: " + error.message);
    } else {
      console.log("Successfully deleted ID:", id);
      // Immediately filter out deleted item from local state
      setBookings((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <main dir="rtl" className="min-h-screen p-6 lg:p-10 text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/consultations")}
              className="px-4 py-2 rounded-xl bg-white border border-[#d4af37]/30 text-xs font-bold text-[#8b6508] shadow-sm hover:bg-[#fbf7f0] transition"
            >
              ← رجوع للأقسام
            </button>
            <h1 className="text-2xl lg:text-3xl font-black text-gold-gradient">
              حجوزات باقات الاستشارة
            </h1>
          </div>
          <span className="rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 px-4 py-1 text-xs font-bold text-[#8b6508]">
            إجمالي الحجوزات ({bookings.length})
          </span>
        </div>

        {/* Bookings Table */}
        <div className="card-ceramic rounded-3xl p-6 bg-white border border-[#d4af37]/20 shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-[#8c6d31]">جاري التحميل...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-[#8c6d31]">لا توجد حجزات استشاره حتى الآن.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs whitespace-nowrap">
                <thead className="border-b border-[#d4af37]/20 text-[#8b6508] bg-[#fbf7f0]">
                  <tr>
                    <th className="p-4">اسم العميل</th>
                    <th className="p-4">مدة الاستشارة</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">الإيصال</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10">
                  {bookings.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fbf7f0]/50 transition">
                      <td className="p-4 font-bold text-[#2c220f]">
                        <p>{item.user_name || "مستخدم"}</p>
                        <p className="text-[10px] text-[#8c6d31]" dir="ltr">{item.user_email}</p>
                      </td>
                      <td className="p-4 font-semibold text-[#8b6508]">
                        استشارة ({item.duration_minutes} دقيقة)
                      </td>
                      <td className="p-4 font-bold">{item.price} جنيه</td>
                      <td className="p-4">
                        {item.receipt_url ? (
                          <a
                            href={item.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold underline hover:text-blue-800"
                          >
                            عرض الإيصال ↗
                          </a>
                        ) : (
                          <span className="text-gray-400">لا يوجد</span>
                        )}
                      </td>
                      <td className="p-4 text-[#8c6d31]">{new Date(item.created_at).toLocaleString('ar-EG')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {item.status === 'pending' ? 'قيد الانتظار ⏳' : 'تم التأكيد ✓'}
                        </span>
                      </td>
                      <td className="p-4 text-left">
                        <div className="inline-flex items-center gap-2 flex-nowrap">
                          {item.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'confirmed', item.user_email, item.user_name)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm text-[11px] cursor-pointer"
                            >
                              تأكيد
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'pending', item.user_email, item.user_name)}
                              className="px-3 py-1.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition shadow-sm text-[11px] cursor-pointer"
                            >
                              إرجاع للانتظار
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition shadow-sm text-[11px] cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}