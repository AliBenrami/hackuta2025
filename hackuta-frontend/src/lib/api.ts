/**
 * API client for communicating with the FastAPI backend
 */
import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ImageData {
  url: string;
  filename?: string;
  content_type?: string;
  analysis_text?: string;
}

interface ImageResponse {
  id: number;
  url: string;
  filename?: string;
  content_type?: string;
  analysis_text?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface UserResponse {
  id: number;
  user_id: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error("No access token available");
    }

    return {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new image record with URL
   */
  async createImage(imageData: ImageData): Promise<ImageResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/images`, {
      method: "POST",
      headers,
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create image: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all images for the current user
   */
  async getUserImages(): Promise<ImageResponse[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/images`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get images: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific image by ID
   */
  async getImage(imageId: number): Promise<ImageResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get image: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload and analyze an image file
   */
  async uploadAndAnalyzeImage(file: File): Promise<ImageResponse> {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error("No access token available");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/analyze/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload and analyze image: ${response.statusText}`
      );
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
export type { ImageData, ImageResponse, UserResponse };
