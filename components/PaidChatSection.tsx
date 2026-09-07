"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

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

export default function PaidChatSection() {
  const [chats, setChats] = useState<PaidChat[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || "";
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split("@")[0];
        
        setUserEmail(email);
        setUserName(name);
        fetchUserChats(email);
      } else {
        setInitializing(false);
      }
    };

    getUserSession();
  }, []);

  const fetchUserChats = async (email: string) => {
    if (!email) {
      setInitializing(false);
      return;
    }

    const { data } = await supabase
      .from("paid_chats")
      .select("*")
      .eq("user_email", email.trim())
      .order("created_at", { ascending: true });

    if (data) {
      setChats(data);
    }
    setInitializing(false);
  };

  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      fetchUserChats(userEmail);
    }, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      return alert("يجب تسجيل الدخول أولاً لإرسال سؤال استشاري.");
    }
    if (!file || !newQuestion) {
      return alert("برجاء كتابة السؤال وإرفاق إيصال التحويل.");
    }

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `receipt_${Date.now()}_${Math.random()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from("receipts").upload(fileName, file);
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
      
      const { error: dbErr } = await supabase.from("paid_chats").insert({
        user_name: userName,
        user_email: userEmail.trim(),
        question: newQuestion,
        receipt_url: publicUrlData.publicUrl,
        status: "pending",
      });

      if (dbErr) throw dbErr;

      // Trigger email notification to the admin via your API route
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "سؤال استشاري / محادثة مدفوعة جديدة",
            name: userName,
            email: userEmail,
            subject: "سؤال استشاري جديد بانتظار الرد",
            message: `
              <p><strong>السؤال:</strong> ${newQuestion}</p>
              <p><a href="${publicUrlData.publicUrl}" target="_blank">عرض إيصال التحويل ↗</a></p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to trigger email notification:", emailErr);
      }

      setNewQuestion("");
      setFile(null);
      await fetchUserChats(userEmail);
      alert("تم إرسال سؤالك وإيصال الدفع بنجاح! سيتم مراجعته والرد عليه قريباً.");
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة نهائياً؟")) return;

    const { error } = await supabase.from("paid_chats").delete().eq("id", chatId);
    if (!error) {
      setChats(chats.filter((c) => c.id !== chatId));
    } else {
      alert("تعذر حذف المحادثة.");
    }
  };

  if (initializing) {
    return <div className="py-12 text-center text-xs text-[#8c6d31]">جاري تحميل سجل المحادثات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-[#2c220f]">اسأل واستشر (دفع لكل سؤال)</h2>
        <div className="card-ceramic my-3 rounded-2xl border border-[#d4af37]/40 bg-[#fbf7f0] p-5 text-center shadow-inner flex flex-col items-center">
          <p className="text-sm font-bold text-[#6e5422] mb-3">
            قم بتحويل <span className="text-[#8b6508]">50 جنيه</span> باستخدام الكود أو الرابط التالي:
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
      </div>

      {!userEmail ? (
        <div className="card-ceramic rounded-3xl p-8 text-center text-sm text-[#8c6d31] bg-[#fbf7f0] border border-[#d4af37]/20">
          برجاء تسجيل الدخول لحسابك لاستعراض وإرسال الأسئلة الاستشارية.
        </div>
      ) : (
        <>
          <div className="card-ceramic h-[450px] overflow-y-auto rounded-3xl p-6 space-y-6 border border-[#d4af37]/20 bg-[#fbf7f0]">
            {chats.length === 0 ? (
              <p className="text-center text-xs text-[#8c6d31] mt-36">
                لا توجد استشارات سابقة. اطرح سؤالك أدناه للبدء!
              </p>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className="space-y-3 border-b border-[#d4af37]/10 pb-6 last:border-0">
                  <div className="flex items-center justify-between text-[11px] px-2">
                    <span className={`font-bold px-3 py-0.5 rounded-full ${chat.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {chat.status === 'pending' ? 'قيد الانتظار ⏳' : 'تم الرد ✓'}
                    </span>
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="text-red-500 hover:text-red-700 font-bold transition"
                    >
                      حذف المحادثة 🗑️
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl p-4 text-xs shadow-sm bg-white border border-[#d4af37]/30 text-[#2c220f] rounded-bl-none">
                        <p className="font-bold text-[10px] opacity-75 mb-1">سؤالك:</p>
                        <p className="whitespace-pre-wrap">{chat.question}</p>
                      </div>
                    </div>

                    {/* Admin Answer (if available) */}
                    {chat.answer && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl p-4 text-xs shadow-sm bg-[#5c4010] text-white rounded-br-none">
                          <p className="font-bold text-[10px] opacity-75 mb-1">رد الخبير:</p>
                          <p className="whitespace-pre-wrap">{chat.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAskQuestion} className="card-ceramic rounded-2xl p-6 space-y-4 border border-[#d4af37]/20 bg-white">
            <p className="text-xs font-bold text-[#8b6508]">طرح سؤال استشاري جديد (يتطلب إيصال دفع جديد):</p>
            
            <div>
              <textarea
                required
                rows={3}
                placeholder="اكتب تفاصيل سؤالك بوضوح..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full rounded-xl border border-[#d4af37]/30 bg-white p-3 text-xs font-semibold text-[#2c220f] outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="w-full">
                <label className="text-xs font-bold text-[#8c6d31] block mb-1">إيصال تحويل InstaPay (50 جنيه)</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#8c6d31] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fbf7f0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#8b6508]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold-3d w-full sm:w-auto px-8 py-3 text-xs font-bold rounded-xl whitespace-nowrap shadow-md disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : "إرسال السؤال وإيصال الدفع"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}