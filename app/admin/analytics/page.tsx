"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

type AnalyticsStats = {
  totalRevenue: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  topProducts: { title: string; count: number }[];
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRevenue: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateAnalytics() {
      setLoading(true);

      // Fetch requests along with associated product prices
      const { data: requests, error } = await supabase
        .from("access_requests")
        .select("status, product_id, products(title, price)");

      if (error || !requests) {
        setLoading(false);
        return;
      }

      let revenue = 0;
      let approved = 0;
      let pending = 0;
      let rejected = 0;
      const productSalesMap: Record<string, number> = {};

      requests.forEach((req: any) => {
        if (req.status === "approved") {
          approved++;
          const price = req.products?.price || 0;
          revenue += Number(price);

          const title = req.products?.title || "ملف غير معروف";
          productSalesMap[title] = (productSalesMap[title] || 0) + 1;
        } else if (req.status === "pending") {
          pending++;
        } else if (req.status === "rejected") {
          rejected++;
        }
      });

      // Sort top products by sales volume
      const sortedProducts = Object.entries(productSalesMap)
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRevenue: revenue,
        approvedCount: approved,
        pendingCount: pending,
        rejectedCount: rejected,
        topProducts: sortedProducts,
      });

      setLoading(false);
    }

    calculateAnalytics();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center text-[#8b6508]">
        <div className="card-ceramic rounded-2xl px-8 py-6 text-center shadow-lg">
          <p className="animate-pulse text-base font-bold">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-[var(--foreground)] p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 border-b border-[var(--border)] pb-6 space-y-4">
          <div>
            <BackButton label="العودة لوحة التحكم" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-[#8b6508]">
              التقارير والتحليلات
            </p>
            <h1 className="text-gold-gradient mt-2 text-3xl font-bold sm:text-4xl">
              إحصائيات المنصة (Analytics)
            </h1>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-xs font-semibold text-[#8b6508]">إجمالي الأرباح</p>
            <p className="text-gold-gradient mt-3 text-3xl font-extrabold">
              {stats.totalRevenue.toLocaleString()} <span className="text-lg">جنيه</span>
            </p>
          </div>

          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-xs font-semibold text-[#8b6508]">الملفات المبيعة (المقبولة)</p>
            <p className="mt-3 text-3xl font-extrabold text-[#3a2800]">{stats.approvedCount}</p>
          </div>

          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-xs font-semibold text-[#8b6508]">طلبات قيد الانتظار</p>
            <p className="mt-3 text-3xl font-extrabold text-amber-700">{stats.pendingCount}</p>
          </div>

          <div className="card-ceramic rounded-2xl p-6">
            <p className="text-xs font-semibold text-[#8b6508]">الطلبات المرفوضة</p>
            <p className="mt-3 text-3xl font-extrabold text-rose-700">{stats.rejectedCount}</p>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="card-ceramic overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="mb-6 border-b border-[var(--border)] pb-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#8b6508]">
              المنتجات المتميزة
            </p>
            <h2 className="text-gold-gradient mt-1 text-xl font-bold">
              الأكثر مبيعاً
            </h2>
          </div>

          {stats.topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-[#8c7a5c]">
              لا توجد مبيعات مكتملة حتى الآن.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {stats.topProducts.map((prod, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 transition hover:bg-black/[0.02] px-2 rounded-lg"
                >
                  <span className="text-sm font-bold text-[#3a2800]">{prod.title}</span>
                  <span className="btn-gold-3d rounded-full px-4 py-1.5 text-xs font-extrabold">
                    {prod.count} عملية شراء
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}