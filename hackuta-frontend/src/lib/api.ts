/**
 * Simple API client for backend communication
 * All authentication is handled by backend via session cookies
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
 * Get current user from backend
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include', // Send cookies
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
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
 * Get all images for current user
 */
export async function getImages(): Promise<Image[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/images`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

/**
 * Upload and analyze an image
 */
export async function uploadImage(file: File): Promise<Image> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_BASE_URL}/analyze/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  return await response.json();
}