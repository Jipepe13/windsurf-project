import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Image as ImageIcon,
  Videocam as VideocamIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  compressImage,
  addWatermark,
  processVideo,
  isImageFile,
  isVideoFile,
  validateFileSize,
} from '../../utils/mediaProcessing';

interface MediaUploadProps {
  onUploadComplete: (url: string) => void;
  maxSizeMB?: number;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  maxSizeMB = 2,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      // Validate file size
      if (!validateFileSize(file, maxSizeMB)) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      let processedFile: File;

      if (isImageFile(file)) {
        // Process image
        const compressedImage = await compressImage(file);
        processedFile = await addWatermark(compressedImage, {
          text: `@${user?.username || 'user'}`,
          fontSize: 24,
          opacity: 0.5,
        });

        // Show preview
        const previewUrl = URL.createObjectURL(processedFile);
        setPreviewUrl(previewUrl);
        setShowPreview(true);
      } else if (isVideoFile(file)) {
        // Process video
        processedFile = await processVideo(file);
        
        // Show preview
        const previewUrl = URL.createObjectURL(processedFile);
        setPreviewUrl(previewUrl);
        setShowPreview(true);
      } else {
        throw new Error('Unsupported file type');
      }

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual upload logic
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadProgress(100);
        setIsUploading(false);
        // Simulate a returned URL
        onUploadComplete(`https://example.com/media/${processedFile.name}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setShowPreview(false);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  return (
    <>
      <Box>
        <input
          accept="image/*,video/*"
          style={{ display: 'none' }}
          id="media-upload"
          type="file"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <label htmlFor="media-upload">
          <IconButton
            component="span"
            disabled={isUploading}
            color="primary"
          >
            {isUploading ? (
              <CircularProgress size={24} />
            ) : (
              <ImageIcon />
            )}
          </IconButton>
        </label>
        {error && (
          <Typography color="error" variant="caption">
            {error}
          </Typography>
        )}
      </Box>

      <Dialog
        open={showPreview}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Aperçu du média
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewUrl && (
            isImageFile(new File([], '')) ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
            ) : (
              <video
                src={previewUrl}
                controls
                style={{ width: '100%', maxHeight: '500px' }}
              />
            )
          )}
          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ mt: 1 }}>
                {uploadProgress}% uploaded
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MediaUpload;
