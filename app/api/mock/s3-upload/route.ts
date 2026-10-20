import { NextRequest, NextResponse } from "next/server";
import { simulateLatency } from "@/lib/mock/http";

// Mock AWS S3 direct PUT upload handler
export async function PUT(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Simulate network upload latency
  await simulateLatency(250);

  return new NextResponse(null, {
    status: 200,
    headers: {
      "ETag": `"${crypto.randomUUID()}"`,
      "x-amz-server-side-encryption": "AES256",
    },
  });
}
