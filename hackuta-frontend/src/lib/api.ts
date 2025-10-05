export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SESSION_STORAGE_KEY = "session_token";
const SESSION_COOKIE_NAME = "session_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface User {
  sub: string;
  email: string;
  name: string;
}

export interface Image {
  id: number;
  url: string;
  filename: string;
  content_type: string;
  analysis_text?: string;
  created_at: string;
}

export interface Analytics {
  quality: number;
  hostility: number;
  engagement: number;
  resonance: number;
}

export interface AnalyzeImageResponse {
  image: Image;
  analytics: Analytics;
}

export interface CampaignCreate {
  name: string;
  description: string;
  emotion?: string;
  success?: string;
  inspiration?: string;
}

export interface CampaignResponse {
  id: number;
  user_id: number;
  name: string;
  description: string;
  emotion?: string | null;
  success?: string | null;
  inspiration?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageData {
  url: string;
  filename: string;
  content_type: string;
}

function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookieString = document.cookie;
  if (!cookieString) return null;
  const cookies = cookieString.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value ?? "");
    }
  }
  return null;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  return readClientCookie(SESSION_COOKIE_NAME);
}

export function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}

export async function persistSession(token: string): Promise<void> {
  setSessionToken(token);

  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, maxAge: SESSION_MAX_AGE_SECONDS }),
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to persist session cookie", error);
  }
}

export async function destroySession(redirect = true): Promise<void> {
  clearSessionToken();

  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to destroy session cookie", error);
  }

  if (redirect) {
    // Just redirect to home page, no need to call backend logout
    window.location.href = "/";
  }
}

async function authorizedFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getSessionToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      await destroySession();
      return null;
    }

    const data = await response.json();
    if (!data?.user) {
      await destroySession();
      return null;
    }

    return data.user as User;
  } catch (error) {
    console.error("Error fetching current user", error);
    return null;
  }
}

export function getLoginUrl(): string {
  return `${API_BASE_URL}/auth/login`;
}

export function getSignupUrl(): string {
  // Backend currently handles signup during the login/OAuth flow.
  return `${API_BASE_URL}/auth/login`;
}

export function getLogoutUrl(): string {
  return `${API_BASE_URL}/auth/logout`;
}

export function getAnalyticsUrl(): string {
  return `${API_BASE_URL}/analytics/image`;
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function getImages(): Promise<Image[]> {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/images`);

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }

    return (await response.json()) as Image[];
  } catch (error) {
    console.error("Error fetching images", error);
    return [];
  }
}

export async function createImage(imageData: ImageData): Promise<Image> {
  const response = await authorizedFetch(`${API_BASE_URL}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(imageData),
  });

  if (!response.ok) {
    throw new Error("Failed to create image");
  }

  return (await response.json()) as Image;
}

export async function uploadAndAnalyzeImage(
  file: File
): Promise<AnalyzeImageResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authorizedFetch(`${API_BASE_URL}/analyze/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return (await response.json()) as AnalyzeImageResponse;
}

export const apiClient = {
  getUserImages: getImages,
  createImage,
  uploadAndAnalyzeImage,
};

export async function getCampaigns(): Promise<CampaignResponse[]> {
  const response = await authorizedFetch(`${API_BASE_URL}/campaigns`);
  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }
  return (await response.json()) as CampaignResponse[];
}

export async function createCampaign(
  payload: CampaignCreate
): Promise<CampaignResponse> {
  const response = await authorizedFetch(`${API_BASE_URL}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create campaign");
  }
  return (await response.json()) as CampaignResponse;
}
