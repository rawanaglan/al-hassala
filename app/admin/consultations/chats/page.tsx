"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type PaidChat = {
  id: string;
  user_name: string;
  user_email: string;
  question: string;
  answer: string | null;
  receipt_url: string;
  status: string;
  created_at: string;
};

type GroupedUserChat = {
  user_email: string;
  user_name: string;
  chats: PaidChat[];
};

export default function AdminPaidChatsPage() {
  const router = useRouter();
  const [groupedChats, setGroupedChats] = useState<GroupedUserChat[]>([]);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("paid_chats")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }

    if (data) {
      const map: { [email: string]: GroupedUserChat } = {};
      
      data.forEach((item) => {
        const email = item.user_email || "unknown";
        if (!map[email]) {
          map[email] = {
            user_email: email,
            user_name: item.user_name || "مستخدم",
            chats: [],
          };
        }
        map[email].chats.push(item);
      });

      setGroupedChats(Object.values(map));
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendReply = async (chatItem: PaidChat) => {
    const replyText = replyInputs[chatItem.id];
    if (!replyText || !replyText.trim()) {
      return alert("برجاء كتابة الرد أولاً");
    }

    setLoadingId(chatItem.id);

    const updatedAnswer = chatItem.answer
      ? `${chatItem.answer}\n\n[الخبير]: ${replyText.trim()}`
      : `[الخبير]: ${replyText.trim()}`;

    try {
      const { data, error } = await supabase
        .from("paid_chats")
        .update({
          answer: updatedAnswer,
          status: "answered",
        })
        .eq("id", chatItem.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("تنبيه: لم يتم العثور على السجل لتحديثه.");
        return;
      }

      setReplyInputs((prev) => ({ ...prev, [chatItem.id]: "" }));
      await fetchChats();
    } catch (err: any) {
      console.error("Error sending reply:", err);
      alert("خطأ أثناء إرسال الرد: " + (err.message || err));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteChatRow = async (chatId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة من السجل؟")) return;

    const { error } = await supabase.from("paid_chats").delete().eq("id", chatId);
    if (!error) {
      await fetchChats();
    } else {
      alert("تعذر حذف الرسالة.");
    }
  };

  return (
    <main dir="rtl" className="min-h-screen p-6 lg:p-10 text-[var(--foreground)]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER WITH BACK BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/consultations")}
              className="px-4 py-2 rounded-xl bg-white border border-[#d4af37]/30 text-xs font-bold text-[#8b6508] shadow-sm hover:bg-[#fbf7f0] transition"
            >
              ← رجوع للأقسام
            </button>
            <h1 className="text-2xl lg:text-3xl font-black text-gold-gradient">
              إدارة الأسئلة والمحادثات المدفوعة
            </h1>
          </div>
          <span className="rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 px-4 py-1 text-xs font-bold text-[#8b6508]">
            إجمالي المستخدمين النشطين ({groupedChats.length})
          </span>
        </div>

        {/* UNIFIED USER CHAT CARDS */}
        <div className="space-y-6">
          {groupedChats.length === 0 ? (
            <div className="card-ceramic rounded-3xl p-12 text-center text-[#8c6d31] bg-white">
              لا توجد أسئلة مدفوعة أو استشارات حتى الآن.
            </div>
          ) : (
            groupedChats.map((group) => {
              const isPending = group.chats.some(c => c.status === 'pending');

              return (
                <div key={group.user_email} className="card-ceramic rounded-3xl p-6 border border-[#d4af37]/20 shadow-sm space-y-6 bg-white">
                  
                  {/* User Profile Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d4af37]/10 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-[#2c220f] text-base">{group.user_name}</h3>
                        <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full ${isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isPending ? 'قيد الانتظار ⏳' : 'تم الرد ✓'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8c6d31] mt-0.5" dir="ltr">{group.user_email}</p>
                    </div>
                  </div>

                  {/* UNIFIED CHAT BOX */}
                  <div className="bg-[#fbf7f0] rounded-2xl p-4 max-h-[450px] overflow-y-auto space-y-6 border border-[#d4af37]/20">
                    <p className="text-[11px] font-bold text-[#8c6d31] mb-2">سجل محادثات المستخدم الموحد:</p>
                    
                    {group.chats.map((chatItem) => (
                      <div key={chatItem.id} className="space-y-3 border-b border-[#d4af37]/20 pb-6 last:border-0">
                        
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8c6d31]">
                            {new Date(chatItem.created_at).toLocaleString('ar-EG')}
                          </span>
                          <div className="flex items-center gap-2">
                            {chatItem.receipt_url && (
                              <a
                                href={chatItem.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-bold underline hover:text-blue-800"
                              >
                                عرض الإيصال ↗
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteChatRow(chatItem.id)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              حذف 🗑️
                            </button>
                          </div>
                        </div>

                        {/* User Question Bubble */}
                        <div className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl p-3 text-xs shadow-sm bg-white border border-[#d4af37]/30 text-[#2c220f] rounded-bl-none">
                            <p className="font-bold text-[10px] opacity-75 mb-1">سؤال المستخدم:</p>
                            <p className="whitespace-pre-wrap">{chatItem.question}</p>
                          </div>
                        </div>

                        {/* Admin Answer Bubble */}
                        {chatItem.answer && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] rounded-2xl p-3 text-xs shadow-sm bg-[#5c4010] text-white rounded-br-none">
                              <p className="font-bold text-[10px] text-[#d4af37] mb-1">رد الخبير:</p>
                              <p className="whitespace-pre-wrap">{chatItem.answer}</p>
                            </div>
                          </div>
                        )}

                        {/* Independent Reply Input Box */}
                        <div className="flex gap-2 items-center pt-2">
                          <input
                            type="text"
                            placeholder="اكتب ردك على هذا السؤال..."
                            value={replyInputs[chatItem.id] || ""}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [chatItem.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply(chatItem);
                              }
                            }}
                            className="flex-1 rounded-xl border border-[#d4af37]/30 bg-white p-2.5 text-xs font-semibold text-[#2c220f] outline-none focus:border-[#d4af37]"
                          />
                          <button
                            type="button"
                            disabled={loadingId === chatItem.id}
                            onClick={() => handleSendReply(chatItem)}
                            className="btn-gold-3d px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap shadow-md disabled:opacity-50"
                          >
                            {loadingId === chatItem.id ? "جاري..." : "رد 💬"}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </main>
  );
}