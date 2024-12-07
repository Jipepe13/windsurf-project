export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const xhr = new XMLHttpRequest();

    // Créer une promesse pour gérer l'upload
    const uploadPromise = new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = event.loaded / event.total;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.fileUrl);
          } catch {
            reject(new Error('Réponse invalide du serveur'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Erreur lors du téléchargement'));
          } catch {
            reject(new Error('Erreur lors du téléchargement'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erreur réseau lors du téléchargement'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Téléchargement annulé'));
      });
    });

    // Démarrer l'upload
    xhr.open('POST', '/api/files/upload');
    xhr.send(formData);

    return await uploadPromise;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors du téléchargement');
  }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const response = await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression du fichier');
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de la suppression du fichier');
  }
};

export const getFileMetadata = async (fileUrl: string): Promise<{
  name: string;
  size: number;
  type: string;
  createdAt: Date;
}> => {
  try {
    const response = await fetch(`/api/files/metadata?fileUrl=${fileUrl}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Erreur lors de la récupération des métadonnées'
      );
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(
          'Une erreur est survenue lors de la récupération des métadonnées'
        );
  }
};

export const validateFile = (
  file: File,
  maxSize: number,
  acceptedTypes: string[]
): { valid: boolean; error?: string } => {
  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale : ${formatFileSize(
        maxSize
      )}`,
    };
  }

  // Vérifier le type
  const fileType = file.type.toLowerCase();
  const isValidType = acceptedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2);
      return fileType.startsWith(baseType);
    }
    return fileType === type;
  });

  if (!isValidType) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Types acceptés : ${acceptedTypes.join(
        ', '
      )}`,
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'fa-image';
  if (fileType.startsWith('video/')) return 'fa-video';
  if (fileType.startsWith('audio/')) return 'fa-music';
  if (fileType === 'application/pdf') return 'fa-file-pdf';
  if (fileType.includes('word')) return 'fa-file-word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet'))
    return 'fa-file-excel';
  if (fileType.includes('powerpoint') || fileType.includes('presentation'))
    return 'fa-file-powerpoint';
  if (fileType.includes('zip') || fileType.includes('compressed'))
    return 'fa-file-archive';
  return 'fa-file';
};
