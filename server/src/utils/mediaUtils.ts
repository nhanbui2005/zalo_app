interface MediaSize {
    width: number;
    height: number;
  }
  
  export function determineMediaSize(fileName: string, mimeType?: string): MediaSize {
    const extension = fileName.split('.').pop()?.toLowerCase();
  
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return { width: 300, height: 300 };
      case 'mp4':
      case 'mov':
      case 'avi':
        return { width: 400, height: 225 };
      case 'pdf':
      case 'doc':
      case 'docx':
        return { width: 200, height: 280 };
      case 'mp3':
      case 'wav':
        return { width: 100, height: 100 };
      default:
        if (mimeType) {
          if (mimeType.startsWith('image/')) return { width: 300, height: 300 };
          if (mimeType.startsWith('video/')) return { width: 400, height: 225 };
          if (mimeType.startsWith('audio/')) return { width: 100, height: 100 };
        }
        return { width: 150, height: 150 };
    }
  }