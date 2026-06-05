import { describe, it, expect } from "vitest";
import { serializeLean } from "#server/utils/serialize";

function mockObjectId(hex: string) {
  return { toHexString: () => hex };
}

describe("serializeLean", () => {
  it("converts ObjectId _id to string id", () => {
    const docs = [{ _id: mockObjectId("abc123"), name: "Alice" }] as never[];
    const result = serializeLean(docs);
    expect(result[0]!.id).toBe("abc123");
    expect((result[0] as Record<string, unknown>)["_id"]).toBeUndefined();
  });

  it("converts string _id to string id", () => {
    const docs = [{ _id: "str_id_001", value: 42 }] as never[];
    const result = serializeLean(docs);
    expect(result[0]!.id).toBe("str_id_001");
  });

  it("preserves other fields", () => {
    const docs = [
      { _id: mockObjectId("aaa"), name: "Bob", age: 30 },
    ] as never[];
    const result = serializeLean(docs);
    expect(result[0]!.name).toBe("Bob");
    expect((result[0] as Record<string, unknown>)["age"]).toBe(30);
  });

  it("handles empty array", () => {
    expect(serializeLean([])).toEqual([]);
  });

  it("handles multiple documents", () => {
    const docs = [
      { _id: mockObjectId("aaa"), name: "Alice" },
      { _id: mockObjectId("bbb"), name: "Bob" },
    ] as never[];
    const result = serializeLean(docs);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe("aaa");
    expect(result[1]!.id).toBe("bbb");
  });
});
