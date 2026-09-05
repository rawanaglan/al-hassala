import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not defined");
    }

    const resend = new Resend(apiKey);
    const { userName, userEmail, productTitle, receiptUrl } = await request.json();

    // Sends notification email
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "Aglan.walied@gmail.com",
      subject: `طلب شراء جديد: ${productTitle}`,
      html: `
        <div dir="rtl">
          <h2>طلب وصول جديد عبر InstaPay</h2>
          <p><strong>الاسم:</strong> ${userName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${userEmail}</p>
          <p><strong>الملف:</strong> ${productTitle}</p>
          <p><a href="${receiptUrl}" target="_blank">اضغط هنا لعرض إيصال التحويل</a></p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Email send failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}