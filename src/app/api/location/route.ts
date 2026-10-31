import { NextResponse } from "next/server";
import { addLocation, getHistory, getLatest, normalizePhone } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id ?? body?.phone;
    const { lat, lng, accuracy } = body ?? {};
    if (!id || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "id, lat, lng wajib" }, { status: 400 });
    }
    await addLocation({
      phone: String(id),
      lat,
      lng,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      timestamp: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "gagal menyimpan lokasi" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("phone");
  if (!id) {
    return NextResponse.json({ error: "id wajib" }, { status: 400 });
  }
  const latest = await getLatest(id);
  const history = await getHistory(id);
  return NextResponse.json({ latest, history });
}