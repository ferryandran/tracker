import { NextResponse } from "next/server";
import { addPhoto, getLatestPhoto, getPhotoHistory, normalizePhone } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id ?? body?.phone;
    const { dataUrl } = body ?? {};
    if (!id || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "id dan dataUrl wajib" }, { status: 400 });
    }
    await addPhoto({ phone: String(id), dataUrl, timestamp: Date.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "gagal menyimpan foto" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("phone");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const latest = await getLatestPhoto(id);
  const history = await getPhotoHistory(id);
  return NextResponse.json({ latest, history });
}