import type { ApiResponse } from "@academy-os/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

// Deduplicates concurrent refresh attempts fired by parallel requests that
// all hit a 401 around the same time — without this, N in-flight requests
// would each kick off their own refresh call.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const body = (await response.json()) as ApiResponse<RefreshResponse>;
    storeTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Core request helper. On a 401 (other than from the auth endpoints
 * themselves), it silently attempts a token refresh and retries the
 * original request exactly once before giving up and broadcasting
 * "auth:unauthorized".
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json()) as ApiResponse<T> & {
    message?: string | string[];
    statusCode?: number;
  };

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "Request failed");

    const isAuthEndpoint =
      path.startsWith("/auth/refresh") || path.startsWith("/auth/login");

    if (
      response.status === 401 &&
      !_isRetry &&
      !isAuthEndpoint &&
      typeof window !== "undefined"
    ) {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const refreshed = await refreshPromise;

      if (refreshed) {
        return apiFetch<T>(path, options, true);
      }

      clearTokens();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    throw new ApiError(message, response.status);
  }

  return body;
}
