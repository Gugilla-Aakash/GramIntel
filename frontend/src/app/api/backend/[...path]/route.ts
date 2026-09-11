import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || "http://localhost:8000";

async function proxy(req: NextRequest, params: { path?: string[] }) {
  const path = params.path ? params.path.join("/") : "";
  const url = new URL(req.url);
  const target = `${API_BASE}/${path}${url.search}`;
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (k.toLowerCase() === "host" || k.toLowerCase() === "content-length") return;
    headers[k] = v;
  });
  const method = req.method;
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const text = await req.text();
      body = text || undefined;
      headers["content-type"] = "application/json";
    } else {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 0) body = Buffer.from(buf);
    }
  }
  try {
    const res = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual", // don't let this server-side fetch swallow backend redirects (e.g. OAuth 302 -> Google)
    });

    // "manual" redirect surfaces as an opaqueredirect (status 0) in some runtimes,
    // or as a normal 3xx with a Location header in others — handle both.
    const location = res.headers.get("location");
    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400 && location)) {
      if (!location) {
        return NextResponse.json({ detail: "Backend returned a redirect with no Location header" }, { status: 502 });
      }
      // Forward as a real redirect so the BROWSER navigates (to Google, etc.),
      // instead of this proxy following it server-side and returning the target's HTML.
      return NextResponse.redirect(location, res.status === 0 ? 302 : res.status);
    }

    const resHeaders = new Headers();
    res.headers.forEach((v, k) => {
      if (k.toLowerCase() === "content-encoding" || k.toLowerCase() === "content-length") return;
      resHeaders.set(k, v);
    });
    resHeaders.set("x-proxied-by", "next-backend-proxy");
    if (res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.arrayBuffer();
      return new NextResponse(data, { status: res.status, headers: resHeaders });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { status: res.status, headers: resHeaders });
  } catch (e: any) {
    return NextResponse.json({ detail: `Backend unreachable (${API_BASE}): ${e?.message || e}` }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params);
}
