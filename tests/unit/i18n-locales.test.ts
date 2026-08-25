import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Tree = { [k: string]: string | Tree };

function load(name: string): Tree {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `i18n/locales/${name}.json`), "utf8"),
  );
}

const en = load("en");
const es = load("es");
const ca = load("ca");

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out[prefix + key] = value;
    else Object.assign(out, flatten(value, prefix + key + "."));
  }
  return out;
}

function placeholders(message: string): string[] {
  const names = [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  return [...new Set(names)].sort();
}

const locales = { es, ca } as Record<string, Tree>;
const base = flatten(en as Tree);

describe("locale files", () => {
  it.each(Object.keys(locales))("%s defines every en key", (name) => {
    const missing = Object.keys(base).filter(
      (k) => !(k in flatten(locales[name]!)),
    );
    expect(missing).toEqual([]);
  });

  it.each(Object.keys(locales))("%s defines no extra keys", (name) => {
    const extra = Object.keys(flatten(locales[name]!)).filter(
      (k) => !(k in base),
    );
    expect(extra).toEqual([]);
  });

  it.each(Object.keys(locales))("%s keeps the same placeholders", (name) => {
    const target = flatten(locales[name]!);
    const mismatched = Object.keys(base).filter(
      (k) =>
        target[k] !== undefined &&
        placeholders(base[k]!).join() !== placeholders(target[k]!).join(),
    );
    expect(mismatched).toEqual([]);
  });

  it.each(Object.keys(locales))("%s keeps plural form counts", (name) => {
    const target = flatten(locales[name]!);
    const mismatched = Object.keys(base).filter(
      (k) =>
        base[k]!.includes(" | ") &&
        target[k] !== undefined &&
        !target[k]!.includes(" | "),
    );
    expect(mismatched).toEqual([]);
  });

  it("has no empty messages", () => {
    for (const [name, tree] of Object.entries({ en, ...locales })) {
      const blank = Object.entries(flatten(tree as Tree))
        .filter(([, v]) => !v.trim())
        .map(([k]) => k);
      expect(blank, name).toEqual([]);
    }
  });
});
