import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, name, subject, message, type } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Resend Testing Rule: 'to' MUST be your verified Resend account email
    const testingEmail = "aglan.walied@gmail.com";

    const data = await resend.emails.send({
      // MUST use onboarding@resend.dev while testing without a domain
      from: "Store Notifications <onboarding@resend.dev>",
      to: [testingEmail], 
      subject: subject || `طلب جديد: ${type}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #b8860b;">تنبيه طلب جديد من المتجر</h2>
          <p><strong>نوع الطلب:</strong> ${type}</p>
          <p><strong>اسم العميل:</strong> ${name}</p>
          <p><strong>البريد الإلكتروني للعميل:</strong> ${email}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <div><strong>التفاصيل:</strong><br/>${message}</div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Detailed Email API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}