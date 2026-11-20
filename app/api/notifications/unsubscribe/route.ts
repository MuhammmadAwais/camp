import { NextResponse } from "next/server";
import { handleApiRoute, ok } from "@/lib/server/http";
import { processCaslUnsubscribe } from "@/lib/server/services/notification.service";
import type { CaslUnsubscribeResult } from "@/lib/types/notifications";

function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip")?.trim() || null;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCaslConfirmationHtml(result: CaslUnsubscribeResult): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AutoNexa — Communication Preferences Updated</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#faf8f6;color:#1b1918;margin:0;padding:48px 16px;">
  <main style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd9;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 12px 0;font-size:20px;">Unsubscribed (${escapeHtml(result.channel.toUpperCase())})</h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.5;color:#55504c;">
      Your CASL opt-out preference for <strong>${escapeHtml(result.emailMasked)}</strong> has been recorded immediately on ${escapeHtml(result.recordedAt)}.
    </p>
    <p style="margin:0;font-size:13px;color:#6c6662;">
      You may re-enable Email or SMS alerts anytime in Account Settings → Profile.
    </p>
  </main>
</body>
</html>`;
}

export const GET = handleApiRoute(async (request) => {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await processCaslUnsubscribe(token, {
    ipAddress: extractIpAddress(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  const format = request.nextUrl.searchParams.get("format")?.toLowerCase();
  const accept = request.headers.get("accept") ?? "";
  if (format === "json" || accept.includes("application/json")) {
    return ok(result);
  }

  return new NextResponse(renderCaslConfirmationHtml(result), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});

export const POST = handleApiRoute(async (request) => {
  let token = request.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as {
        token?: unknown;
      } | null;
      if (body && typeof body.token === "string") {
        token = body.token;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formText = await request.text().catch(() => "");
      const params = new URLSearchParams(formText);
      token = params.get("token") ?? "";
    }
  }

  const result = await processCaslUnsubscribe(token, {
    ipAddress: extractIpAddress(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return ok(result);
});
