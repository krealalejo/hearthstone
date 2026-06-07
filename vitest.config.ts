import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["app/**/*.{ts,vue}", "server/**/*.ts"],
      exclude: [
        "app/plugins/**",
        "app/middleware/**",
        "app/pages/**",
        "app/composables/useColorMode.ts",
        "app/composables/useAnimations.ts",
        "app/composables/useBootstrap.ts",
        "app/composables/useConfetti.ts",
        "server/api/auth/google/**",
        "server/plugins/**",
        "server/models/**",
        "**/*.d.ts",
        "**/.nuxt/**",
        "**/dist/**",
        "**/node_modules/**",
        "app/types/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
