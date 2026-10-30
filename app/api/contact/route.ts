import { profile } from "@/content/profile";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ error: "Email is not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const message = String(body?.message ?? "").trim();

  // Bots fill the hidden field, so pretend it worked and send nothing
  if (body?.website) return Response.json({ ok: true });

  const valid =
    name.length > 0 &&
    name.length <= 100 &&
    emailPattern.test(email) &&
    email.length <= 200 &&
    message.length > 0 &&
    message.length <= 4000;
  if (!valid) return Response.json({ error: "Check your details" }, { status: 400 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: process.env.CONTACT_TO ?? profile.email,
      reply_to: email,
      subject: `Team radio from ${name}`,
      text: message,
    }),
  });

  if (!response.ok) return Response.json({ error: "Could not send" }, { status: 502 });
  return Response.json({ ok: true });
}
