export async function fetchJson(params: {
  baseUrl: string;
  path: string;
  method: "GET" | "POST";
  timeoutMs: number;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}): Promise<{ status: number; body: unknown }> {
  const url = new URL(params.path, params.baseUrl).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);
  try {
    const res = await fetch(url, {
      method: params.method,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...Object.fromEntries(
          Object.entries(params.headers ?? {}).filter(([, v]) => v !== undefined) as Array<
            [string, string]
          >
        )
      },
      body: params.body ? JSON.stringify(params.body) : undefined
    });

    const text = await res.text();
    const parsed = safeJsonParse(text);
    return { status: res.status, body: parsed ?? text };
  } finally {
    clearTimeout(timer);
  }
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

