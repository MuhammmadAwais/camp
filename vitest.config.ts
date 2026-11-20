import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "lib/utils.ts",
        "lib/server/rate-limit.ts",
        "lib/server/adapters/billing.adapter.ts",
        "lib/server/adapters/storage.adapter.ts",
        "lib/server/services/bidding.service.ts",
        "lib/server/services/fulfillment.service.ts",
        "lib/server/services/listing.service.ts",
        "lib/server/services/moderation.service.ts",
        "lib/server/services/billing.service.ts",
        "lib/server/services/stripe-webhook.service.ts",
        "lib/server/services/privacy.service.ts",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
