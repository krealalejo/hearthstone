import { describe, it, expect } from "vitest";
import { inventorySchema } from "../../server/utils/validate";

describe("inventorySchema", () => {
  it.each(["food", "cleaning", "hygiene", "misc"])("accepts cat %s", (cat) => {
    expect(inventorySchema.safeParse({ name: "Soap", cat }).success).toBe(true);
  });

  it("rejects an unknown cat", () => {
    expect(
      inventorySchema.safeParse({ name: "Soap", cat: "garden" }).success,
    ).toBe(false);
  });
});
