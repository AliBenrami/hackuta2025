/**
 * Simple API client for backend communication
 * All authentication is handled by backend via session cookies
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * User interface
 */
export interface User {
  sub: string;
  email: string;
  name: string;
}

/**
 * Image interface
 */
export interface Image {
  id: number;
  url: string;
  filename: string;
  content_type: string;
  analysis_text?: string;
  created_at: string;
}

/**
 * Get session token from localStorage
 */
function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("session_token");
  console.log(
    "DEBUG: Retrieved token from localStorage:",
    token ? token.substring(0, 50) + "..." : "NULL"
  );
  return token;
}

/**
 * Set session token in localStorage
 */
export function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  console.log("DEBUG: Storing token in localStorage");
  localStorage.setItem("session_token", token);
  console.log(
    "DEBUG: Token stored, verifying...",
    localStorage.getItem("session_token") ? "SUCCESS" : "FAILED"
  );
}

/**
 * Clear session token from localStorage
 */
export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  console.log("DEBUG: CLEARING TOKEN FROM LOCALSTORAGE");
  console.trace("DEBUG: Clear token called from:");
  localStorage.removeItem("session_token");
}

/**
 * Get current user from backend
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getSessionToken();
    console.log("DEBUG: Session token:", token ? "EXISTS" : "MISSING");

    if (!token) {
      console.log("DEBUG: No session token, user not logged in");
      return null;
    }

    console.log("DEBUG: Fetching user from", `${API_BASE_URL}/auth/me`);
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("DEBUG: Response status:", response.status);

    if (!response.ok) {
      console.log("DEBUG: Response not ok, status:", response.status);
      console.log("DEBUG: Clearing token due to bad response");
      clearSessionToken();
      return null;
    }

    const data = await response.json();
    console.log(
      "DEBUG: User data received:",
      data.user ? "USER FOUND" : "NULL"
    );

    if (!data.user) {
      console.log("DEBUG: No user in response, clearing token");
      clearSessionToken();
    }

    return data.user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Get login URL
 */
export function getLoginUrl(): string {
  return `${API_BASE_URL}/auth/login`;
}

/**
 * Get logout URL
 */
export function getLogoutUrl(): string {
  return `${API_BASE_URL}/auth/logout`;
}

/**
 * Logout user - clears token and redirects
 */
export function logout(): void {
  clearSessionToken();
  window.location.href = getLogoutUrl();
}

/**
 * Get all images for current user
 */
export async function getImages(): Promise<Image[]> {
  try {
    const token = getSessionToken();
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

/**
 * Upload and analyze an image
 */
export async function uploadImage(file: File): Promise<Image> {
  const token = getSessionToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/analyze/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return await response.json();
}
