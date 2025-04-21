export enum MediaStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  ERROR = 'error',
}

export interface MimeTypes {
  // Ảnh
  jpg: 'image/jpeg';
  jpeg: 'image/jpeg';
  png: 'image/png';
  gif: 'image/gif';
  webp: 'image/webp';
  svg: 'image/svg+xml';
  bmp: 'image/bmp';

  // Video
  mp4: 'video/mp4';
  webm: 'video/webm';
  oggVideo: 'video/ogg';
  threegp: 'video/3gpp';

  // Âm thanh
  mp3: 'audio/mpeg';
  wav: 'audio/wav';
  oggAudio: 'audio/ogg';
  aac: 'audio/aac';

  // Văn bản & dữ liệu
  txt: 'text/plain';
  html: 'text/html';
  css: 'text/css';
  js: 'application/javascript';
  json: 'application/json';
  xml: 'application/xml';
  pdf: 'application/pdf';

  // Tài liệu văn phòng
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // File nén và các định dạng đặc biệt
  zip: 'application/zip';
  rar: 'application/vnd.rar';
  gzip: 'application/gzip';
  apk: 'application/vnd.android.package-archive';
  exe: 'application/vnd.microsoft.portable-executable';
}
