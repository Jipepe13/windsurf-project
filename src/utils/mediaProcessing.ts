import Compressor from 'compressorjs';

interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
}

export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality,
      maxWidth,
      success(result) {
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      },
      error(err) {
        reject(err);
      },
    });
  });
};

export const addWatermark = (
  imageFile: File,
  options: WatermarkOptions
): Promise<File> => {
  const {
    text,
    fontSize = 20,
    color = 'rgba(255, 255, 255, 0.7)',
    opacity = 0.7
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark text
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add diagonal watermarks
        const numWatermarks = Math.ceil((canvas.width + canvas.height) / 200);
        for (let i = 0; i < numWatermarks; i++) {
          const x = (i * 200) % canvas.width;
          const y = (i * 200) % canvas.height;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }

        // Convert canvas to file
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], imageFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(imageFile);
  });
};

export const processVideo = async (
  file: File,
  maxSizeMB: number = 2
): Promise<File> => {
  // For now, we'll just check if the video is within size limits
  // In a production environment, you'd want to use a proper video compression library
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Video size must be less than ${maxSizeMB}MB`);
  }
  return file;
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};
