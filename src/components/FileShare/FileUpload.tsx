import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile, FileUploadProgress } from '../../services/fileService';
import './FileShare.css';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number; // en bytes
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB par défaut
  acceptedFileTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
}) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setUploadProgress([]);

      try {
        const uploads = acceptedFiles.map(async (file) => {
          const upload = {
            fileName: file.name,
            progress: 0,
            status: 'uploading' as const,
          };

          setUploadProgress((prev) => [...prev, upload]);

          try {
            const fileUrl = await uploadFile(file, (progress) => {
              setUploadProgress((prev) =>
                prev.map((u) =>
                  u.fileName === file.name
                    ? { ...u, progress: Math.round(progress * 100) }
                    : u
                )
              );
            });

            setUploadProgress((prev) =>
              prev.map((u) =>
                u.fileName === file.name
                  ? { ...u, status: 'completed' as const }
                  : u
              )
            );

            onUploadComplete(fileUrl);
          } catch (error) {
            setUploadProgress((prev) =>
              prev.map((u) =>
                u.fileName === file.name
                  ? {
                      ...u,
                      status: 'error' as const,
                      error:
                        error instanceof Error
                          ? error.message
                          : 'Erreur lors du téléchargement',
                    }
                  : u
              )
            );
            onUploadError(
              error instanceof Error
                ? error.message
                : 'Erreur lors du téléchargement'
            );
          }
        });

        await Promise.all(uploads);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    accept: acceptedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    multiple: true,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${
          isUploading ? 'uploading' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <i className="fas fa-cloud-upload-alt" />
          {isDragActive ? (
            <p>Déposez les fichiers ici...</p>
          ) : (
            <>
              <p>
                Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
              </p>
              <span className="file-limits">
                Taille maximale : {formatFileSize(maxFileSize)}
                <br />
                Types acceptés : {acceptedFileTypes.join(', ')}
              </span>
            </>
          )}
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="upload-progress">
          {uploadProgress.map((upload, index) => (
            <div
              key={index}
              className={`progress-item ${upload.status}`}
            >
              <div className="progress-info">
                <span className="filename">{upload.fileName}</span>
                <span className="status">
                  {upload.status === 'uploading' && (
                    <>{upload.progress}%</>
                  )}
                  {upload.status === 'completed' && (
                    <i className="fas fa-check" />
                  )}
                  {upload.status === 'error' && (
                    <i className="fas fa-exclamation-circle" />
                  )}
                </span>
              </div>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              {upload.error && (
                <div className="error-message">{upload.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
