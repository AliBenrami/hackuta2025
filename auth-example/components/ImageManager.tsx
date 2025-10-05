/**
 * Sample component demonstrating image management with authentication
 */
"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useImages } from "@/hooks/useImages";
import { ImageData } from "@/lib/api";

export default function ImageManager() {
  const { data: session, status } = useSession();
  const { images, loading, error, createImage, uploadAndAnalyzeImage } =
    useImages();
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle URL-based image creation
  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    try {
      const imageData: ImageData = {
        url: imageUrl,
        filename: "external-image",
        content_type: "image/jpeg",
      };

      await createImage(imageData);
      setImageUrl("");
      alert("Image saved successfully!");
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Failed to save image"}`
      );
    }
  };

  // Handle file upload and analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      await uploadAndAnalyzeImage(file);
      alert("Image uploaded and analyzed successfully!");
    } catch (err) {
      alert(
        `Error: ${
          err instanceof Error ? err.message : "Failed to upload image"
        }`
      );
    }
  };

  if (status === "loading") {
    return <div className="p-4">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">
          Please sign in to manage images
        </h2>
        <button
          onClick={() => signIn()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign In with Auth0
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Image Manager</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Add Image by URL */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Add Image by URL</h2>
        <form onSubmit={handleCreateImage} className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL..."
            className="flex-1 px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Image"}
          </button>
        </form>
      </div>

      {/* Upload and Analyze Image */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Upload and Analyze Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {selectedFile.name} (
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Images List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Your Images ({images.length})
        </h2>
        {loading && images.length === 0 ? (
          <div className="text-center py-8">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No images yet. Add some above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="border rounded p-4">
                <img
                  src={image.url}
                  alt={image.filename || "Image"}
                  className="w-full h-48 object-cover rounded mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                  }}
                />
                <div className="text-sm">
                  <p className="font-medium truncate">
                    {image.filename || "Untitled"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                  {image.analysis_text && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                      {image.analysis_text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
