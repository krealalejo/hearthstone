type Params = Record<string, unknown>;

interface Translator {
  t: (key: string, params?: Params | number, plural?: number) => string;
}

function translator(): Translator | null {
  try {
    return (useNuxtApp() as unknown as { $i18n?: Translator }).$i18n ?? null;
  } catch {
    return null;
  }
}

export function t(key: string, params?: Params): string {
  const i18n = translator();
  if (!i18n) return key;
  return params ? i18n.t(key, params) : i18n.t(key);
}

export function tc(key: string, count: number, params?: Params): string {
  const i18n = translator();
  if (!i18n) return key;
  return i18n.t(key, params ?? { n: count }, count);
}
