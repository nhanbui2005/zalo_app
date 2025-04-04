import { useState, useEffect } from 'react';
import { MediaService } from '../services/MediaService';

export const useMedia = (mediaId: string) => {
  const [status, setStatus] = useState<'pending' | 'downloading' | 'completed' | 'error'>('pending');
  const [progress, setProgress] = useState(0);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const mediaService = MediaService.getInstance();

    const updateMediaInfo = async () => {
      try {
        const [currentStatus, currentProgress, currentPath] = await Promise.all([
          mediaService.getMediaStatus(mediaId),
          mediaService.getDownloadProgress(mediaId),
          mediaService.getLocalPath(mediaId)
        ]);

        if (!mounted) return;

        setStatus(currentStatus);
        setProgress(currentProgress);
        setLocalPath(currentPath);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      }
    };

    // Cập nhật thông tin ban đầu
    updateMediaInfo();

    // Thiết lập interval để cập nhật thông tin
    const interval = setInterval(updateMediaInfo, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [mediaId]);

  const retryDownload = async () => {
    try {
      setError(null);
      await MediaService.getInstance().retryDownload(mediaId);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    status,
    progress,
    localPath,
    error,
    retryDownload
  };
}; 