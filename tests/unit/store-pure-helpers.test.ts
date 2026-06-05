import { describe, it, expect } from "vitest";
import {
  memberColor,
  levelInfo,
  money,
  MEMBER_COLORS,
  LEVELS,
} from "~/stores/home";

describe("memberColor", () => {
  it("returns known color for 'alex'", () => {
    expect(memberColor("alex")).toBe(MEMBER_COLORS["alex"]);
  });

  it("returns known color for 'sam'", () => {
    expect(memberColor("sam")).toBe(MEMBER_COLORS["sam"]);
  });

  it("returns fallback oklch for unknown id", () => {
    expect(memberColor("unknown_user_xyz")).toBe("oklch(0.6 0.04 75)");
  });
});

describe("levelInfo", () => {
  it("level 1 at 0 xp", () => {
    const info = levelInfo(0);
    expect(info.level).toBe(1);
    expect(info.name).toBe(LEVELS[0]);
    expect(info.into).toBe(0);
    expect(info.per).toBe(250);
    expect(info.pct).toBe(0);
  });

  it("level 1 at 125 xp = 50%", () => {
    const info = levelInfo(125);
    expect(info.level).toBe(1);
    expect(info.pct).toBe(50);
    expect(info.into).toBe(125);
  });

  it("level 2 at 250 xp", () => {
    const info = levelInfo(250);
    expect(info.level).toBe(2);
    expect(info.name).toBe(LEVELS[1]);
    expect(info.into).toBe(0);
  });

  it("level 3 at 500 xp", () => {
    const info = levelInfo(500);
    expect(info.level).toBe(3);
  });

  it("caps at max level (LEVELS.length)", () => {
    const info = levelInfo(9999);
    expect(info.level).toBe(LEVELS.length);
    expect(info.name).toBe(LEVELS[LEVELS.length - 1]);
  });
});

describe("money", () => {
  it("formats number with default $", () => {
    expect(money(10.5)).toBe("10.50 $");
  });

  it("formats with custom currency", () => {
    expect(money(5, "€")).toBe("5.00 €");
  });

  it("returns '— $' for null", () => {
    expect(money(null)).toBe("— $");
  });

  it("returns '— $' for undefined", () => {
    expect(money(undefined)).toBe("— $");
  });

  it("formats 0", () => {
    expect(money(0)).toBe("0.00 $");
  });

  it("uses custom currency symbol for null", () => {
    expect(money(null, "€")).toBe("— €");
  });
});
