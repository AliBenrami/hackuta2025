/**
 * React hook for managing images with the API
 */
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient, ImageResponse, ImageData } from "@/lib/api";

export function useImages() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's images
  const loadImages = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const userImages = await apiClient.getUserImages();
      setImages(userImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  // Create a new image record
  const createImage = async (imageData: ImageData) => {
    if (status !== "authenticated") {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      const newImage = await apiClient.createImage(imageData);
      setImages((prev) => [newImage, ...prev]);
      return newImage;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create image");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload and analyze an image file
  const uploadAndAnalyzeImage = async (file: File) => {
    if (status !== "authenticated") {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      const newImage = await apiClient.uploadAndAnalyzeImage(file);
      setImages((prev) => [newImage, ...prev]);
      return newImage;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load images when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      loadImages();
    }
  }, [status]);

  return {
    images,
    loading,
    error,
    createImage,
    uploadAndAnalyzeImage,
    refreshImages: loadImages,
  };
}
