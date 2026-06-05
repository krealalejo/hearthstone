export const MEMBER_COLORS: Record<string, string> = {
  alex: "#5b8abb",
  sam: "#b46762",
  jordan: "#51895e",
  riley: "#a172ac",
  casey: "#a37640",
};

export function memberColor(id: string): string {
  return MEMBER_COLORS[id] ?? "#8f7d66";
}

export const LEVELS = [
  "Fresh Start",
  "Tidy Sprout",
  "House Helper",
  "Home Keeper",
  "Space Steward",
  "Order Adept",
  "Domestic Pro",
  "Hearth Master",
];

export function levelInfo(totalXp: number) {
  const per = 250;
  const idx = Math.min(LEVELS.length - 1, Math.floor(totalXp / per));
  const into = totalXp - idx * per;
  return {
    level: idx + 1,
    name: LEVELS[idx],
    into,
    per,
    pct: Math.round((into / per) * 100),
  };
}

export function money(n: number | null | undefined, currency = "$"): string {
  if (n == null) return "— " + currency;
  return Number(n).toFixed(2) + " " + currency;
}
