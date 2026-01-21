import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = String(body?.message ?? "");
    const sessionId = String(body?.sessionId ?? "");
    const user = body?.user ?? null;

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;
    if (!n8nUrl) {
      return NextResponse.json(
        { error: "N8N_CHAT_WEBHOOK_URL not set" },
        { status: 500 }
      );
    }

    const n8nRes = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Se quiser um token no n8n:
        ...(process.env.N8N_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ message, sessionId, user }),
    });

    const text = await n8nRes.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // se n8n devolveu texto puro
      data = { answer: text };
    }

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: "n8n error", status: n8nRes.status, details: data },
        { status: 502 }
      );
    }

    // Normaliza sempre
    return NextResponse.json({
      answer: data.answer ?? data.output ?? data.text ?? "",
      sources: data.sources ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
