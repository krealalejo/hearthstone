let clientRefresh: Promise<boolean> | null = null;

export function accessTokenFrom(setCookies: string[]): string | null {
  const header = setCookies.find((c) => c.startsWith("access_token="));
  return header ? (header.split(";")[0] ?? null) : null;
}

export function withAccessToken(cookieHeader: string, accessToken: string): string {
  const kept = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c && !c.startsWith("access_token="));
  return [...kept, accessToken].join("; ");
}

async function refreshOnServer(): Promise<boolean> {
  const event = useRequestEvent();
  if (!event) return false;

  const setCookies: string[] = [];
  try {
    await $fetch("/api/auth/refresh", {
      method: "POST",
      headers: { cookie: event.node.req.headers.cookie ?? "" },
      onResponse({ response }) {
        const headers = response.headers as Headers & {
          getSetCookie?: () => string[];
        };
        const values = headers.getSetCookie?.() ?? [];
        setCookies.push(
          ...(values.length ? values : [headers.get("set-cookie") ?? ""]),
        );
      },
    });
  } catch {
    return false;
  }

  const cookies = setCookies.filter(Boolean);
  for (const cookie of cookies) {
    event.node.res.appendHeader("set-cookie", cookie);
  }

  const accessToken = accessTokenFrom(cookies);
  if (accessToken) {
    event.node.req.headers.cookie = withAccessToken(
      event.node.req.headers.cookie ?? "",
      accessToken,
    );
  }
  return true;
}

function refreshOnClient(): Promise<boolean> {
  clientRefresh ??= $fetch("/api/auth/refresh", { method: "POST" })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      clientRefresh = null;
    });
  return clientRefresh;
}

export function refreshSession(): Promise<boolean> {
  return import.meta.server ? refreshOnServer() : refreshOnClient();
}
