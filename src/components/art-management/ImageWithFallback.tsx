import { useState, useEffect } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ImageWithFallbackProps {
  imageUrl: string;
  altText: string;
  className?: string;
  artworkId?: string;
  onImageUpdated?: (artworkId: string, imageUrl: string) => void;
}

const ImageWithFallback = ({
  imageUrl,
  altText,
  className = "",
  artworkId,
  onImageUpdated,
}: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { uploadImage, uploading } = useImageUpload();

  // Reset error state when imageUrl changes
  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  const handleImageError = () => {
    setError(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !artworkId) return;

    try {
      const file = e.target.files[0];
      const newImageUrl = await uploadImage(file);

      if (newImageUrl && onImageUpdated) {
        onImageUpdated(artworkId, newImageUrl);
      }

      setError(false);
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  // Placeholder component when image fails to load or no image URL
  const renderPlaceholder = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center justify-center">
      {artworkId ? (
        <>
          <div className="text-center text-gray-500 mb-2">
            <div className="text-3xl mb-1">🖼️</div>
            <div className="text-sm">Image non disponible</div>
          </div>
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              className="mt-2 text-xs bg-white/80 hover:bg-white"
            >
              <UploadIcon className="h-3 w-3 mr-1" />
              {uploading ? "Chargement..." : "Ajouter une image"}
            </Button>
          </label>
        </>
      ) : (
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-1">🎨</div>
          <div className="text-sm">Image non disponible</div>
        </div>
      )}
    </div>
  );

  // If artworkId exists, this is editable with hover controls
  const renderEditableImage = () => (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={imageUrl}
        alt={altText}
        className={`w-full h-full object-cover ${className}`}
        onError={handleImageError}
      />
      {isHovered && artworkId && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-200">
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              className="bg-white/90 hover:bg-white text-sm"
            >
              <UploadIcon className="h-4 w-4 mr-1" />
              {uploading ? "Uploading..." : "Change Image"}
            </Button>
          </label>
        </div>
      )}
    </div>
  );

  if (error || !imageUrl) {
    return renderPlaceholder();
  }

  return artworkId ? (
    renderEditableImage()
  ) : (
    <img
      src={imageUrl}
      alt={altText}
      className={`w-full h-full object-cover ${className}`}
      onError={handleImageError}
    />
  );
};

export default ImageWithFallback;
