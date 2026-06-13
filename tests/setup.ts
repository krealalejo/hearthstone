import { beforeAll, vi } from "vitest";

beforeAll(() => {
  const originalWarn = console.warn.bind(console);
  vi.spyOn(console, "warn").mockImplementation((msg, ...args) => {
    if (typeof msg === "string" && msg.includes("<Suspense> is an experimental feature")) return;
    originalWarn(msg, ...args);
  });
});
