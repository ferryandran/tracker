import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body ?? {};
    const raw = String(phone ?? "").replace(/\D/g, "");
    if (raw.length < 8) {
      return NextResponse.json({ error: "nomor HP tidak valid" }, { status: 400 });
    }
    const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const trackUrl = `${origin}/verify/${token}`;
    const dashboardUrl = `${origin}/portal/${token}`;
    const waText = encodeURIComponent(
      `Halo, mohon verifikasi nomor Anda melalui link berikut: ${trackUrl}`
    );
    const waUrl = `https://wa.me/${raw}?text=${waText}`;
    return NextResponse.json({ id: token, phone: raw, trackUrl, dashboardUrl, waUrl });
  } catch {
    return NextResponse.json({ error: "gagal membuat verifikasi" }, { status: 500 });
  }
}