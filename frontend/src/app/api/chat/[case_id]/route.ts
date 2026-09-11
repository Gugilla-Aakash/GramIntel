import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: { case_id: string } }
) {
  const target = `${API_BASE}/cases/${params.case_id}/chat`;
  const auth = req.headers.get("authorization") || "";
  let body: string | undefined;
  try {
    body = await req.text();
  } catch {
    body = undefined;
  }

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: body || undefined,
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return new Response(
        `data: {"error": "backend_${upstream.status}"}\n\n${
          detail ? `data: {"detail": ${JSON.stringify(detail)}}\n\n` : ""
        }data: [DONE]\n\n`,
        {
          status: upstream.status >= 400 ? upstream.status : 200,
          headers: { "Content-Type": "text/event-stream" },
        }
      );
    }

    const reader = upstream.body.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (e: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: "\n[connection interrupted — showing what we have]" })}\n\n`
            )
          );
        } finally {
          reader.releaseLock();
        }
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: any) {
    return new Response(
      `data: {"error": "backend_unreachable", "detail": ${JSON.stringify(
        e?.message || "unreachable"
      )}}\n\ndata: [DONE]\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }
}
