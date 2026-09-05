import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminConsultationsHub() {
  const supabase = await createSupabaseServerClient();

  // Fetch counts or pending badges if desired
  const { count: pendingChats } = await supabase
    .from("paid_chats")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Using "consultations" based on your previous bookings page table name
  const { count: pendingBookings } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <main dir="rtl" className="min-h-screen p-6 lg:p-10 text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--border)] bg-white/60 text-[#6b5839] hover:bg-black/[0.03] hover:text-[#3a2800] rounded-lg text-xs font-bold transition"
            >
              ← لوحة التحكم
            </Link>
          </div>

          <h1 className="text-3xl font-black text-gold-gradient">
            إدارة الاستشارات والأسئلة
          </h1>
          <p className="text-sm text-[#8c6d31]">
            اختر القسم الذي تريد إدارته ومتابعة طلبات العملاء فيه.
          </p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Paid Chats Card */}
          <Link
            href="/admin/consultations/chats"
            className="card-ceramic rounded-3xl p-8 border border-[#d4af37]/30 hover:border-[#d4af37] bg-white transition shadow-sm flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">💬</span>
                {pendingChats ? (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    {pendingChats} جديد
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-black text-[#2c220f] group-hover:text-[#8b6508] transition">
                الأسئلة والمحادثات المدفوعة
              </h2>
              <p className="text-xs text-[#8c6d31] leading-relaxed">
                متابعة الأسئلة النصية، فحص إيصالات الدفع، والرد مباشرة على استفسارات المستخدمين.
              </p>
            </div>
            <span className="text-xs font-bold text-[#8b6508] underline">
              إدارة المحادثات ←
            </span>
          </Link>

          {/* Consultancy Bookings Card */}
          <Link
            href="/admin/consultations/bookings"
            className="card-ceramic rounded-3xl p-8 border border-[#d4af37]/30 hover:border-[#d4af37] bg-white transition shadow-sm flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">📅</span>
                {pendingBookings ? (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    {pendingBookings} جديد
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-black text-[#2c220f] group-hover:text-[#8b6508] transition">
                حجوزات باقات الاستشارة
              </h2>
              <p className="text-xs text-[#8c6d31] leading-relaxed">
                متابعة حجوزات باقات الاستشارة (15 دقيقة، 30 دقيقة، ساعة كاملة) وتفاصيل المواعيد.
              </p>
            </div>
            <span className="text-xs font-bold text-[#8b6508] underline">
              إدارة الحجوزات ←
            </span>
          </Link>

        </div>

      </div>
    </main>
  );
}