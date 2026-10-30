const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem("ip_token");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error?.toString() || "Request failed", res.status);
  }

  return data as T;
}

export function setToken(token: string) {
  localStorage.setItem("ip_token", token);
}

export function clearToken() {
  localStorage.removeItem("ip_token");
}

export function hasToken(): boolean {
  return !!getToken();
}
