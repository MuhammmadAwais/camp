import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { BadRequestError, ValidationError } from "@/lib/server/errors";
import { created, handleApiRoute } from "@/lib/server/http";
import {
  relistVehicle,
  relistVehicleSchema,
} from "@/lib/server/services/settings.service";

export const POST = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireAuth();
    const { id } = await context.params;
    const rawText = await request.text();

    let rawBody: unknown = {};
    if (rawText.trim().length > 0) {
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        throw new BadRequestError(
          "Request body must be valid JSON.",
          "INVALID_JSON"
        );
      }
    }

    const parsed = relistVehicleSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join(".");
        if (key && !fields[key]) fields[key] = issue.message;
      }
      throw new ValidationError("Some relist fields need attention.", fields);
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const result = await relistVehicle(ctx, id, parsed.data, { ipAddress });
    return created(result);
  }
);
