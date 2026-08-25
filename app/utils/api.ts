import { refreshSession } from "~/utils/session";

type FetchRequest = Parameters<typeof $fetch>[0];
type FetchOptions = Parameters<typeof $fetch>[1];

export function statusOf(err: unknown): number | undefined {
  const e = err as { statusCode?: number; status?: number } | null;
  return e?.statusCode ?? e?.status;
}

export async function api<T>(
  request: FetchRequest,
  options?: FetchOptions,
): Promise<T> {
  try {
    return await $fetch<T>(request, options);
  } catch (err) {
    if (statusOf(err) !== 401) throw err;
    if (!(await refreshSession())) throw err;
    return await $fetch<T>(request, options);
  }
}
