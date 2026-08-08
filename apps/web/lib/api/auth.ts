import { apiFetch, storeTokens, clearTokens } from "./client";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
};

export async function login(credentials: { email: string; password: string }) {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  const result = response as unknown as LoginResponse;
  storeTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function getCurrentUser() {
  const response = await apiFetch<{ user: AuthenticatedUser }>("/auth/me");
  return (response as unknown as { user: AuthenticatedUser }).user;
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    // Always clear locally, even if the server call fails — an expired
    // or already-invalid access token shouldn't block logout.
    clearTokens();
  }
}
