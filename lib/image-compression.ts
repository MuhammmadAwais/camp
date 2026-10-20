import imageCompression from "browser-image-compression";

export type CompressedImageResult = {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  previewUrl: string;
};

// Downscales to 1920px, converts to WebP, and strips privacy-sensitive EXIF metadata (GPS, device info)
export async function compressListingPhoto(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressedImageResult> {
  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
    alwaysKeepResolution: false,
    onProgress: onProgress ? (p: number) => onProgress(Math.round(p)) : undefined,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const convertedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, "") + ".webp",
      { type: "image/webp" }
    );
    const previewUrl = URL.createObjectURL(convertedFile);

    return {
      file: convertedFile,
      originalSizeBytes: file.size,
      compressedSizeBytes: convertedFile.size,
      previewUrl,
    };
  } catch (error) {
    console.warn("browser-image-compression worker failed, falling back to canvas compression", error);
    return fallbackCanvasCompress(file);
  }
}

// Fallback HTML5 canvas compression if Web Worker or package encounters issues
function fallbackCanvasCompress(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1920;

      if (width > height && width > MAX_DIM) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else if (height > MAX_DIM) {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to obtain 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, "") + ".webp",
            { type: "image/webp" }
          );
          const previewUrl = URL.createObjectURL(compressedFile);

          resolve({
            file: compressedFile,
            originalSizeBytes: file.size,
            compressedSizeBytes: compressedFile.size,
            previewUrl,
          });
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}
