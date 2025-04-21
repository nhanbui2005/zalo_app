import { MessageContentType } from './message.enum';
import { MemberResDto } from '~/features/room/dto/room.dto.nested';

export interface MessagParente {
  id: string;
  content: string;
  sender: MemberResDto
  type: MessageContentType;
  createdAt: Date;
}

export interface MediaFile {
  url: string;              // Địa chỉ URL của file (sử dụng resultFiles[index].secure_url)
  public_id: string;        // ID công khai của media trên Cloudinary
  format: string;           // Định dạng của media (ví dụ: 'jpg', 'mp4', ...)
  bytes: number;            // Kích thước file tính bằng bytes
  width: number | null;     // Chiều rộng của media (null nếu không có thông tin)
  height: number | null;    // Chiều cao của media (null nếu không có thông tin)
  duration: number | null;  // Thời gian (duration) nếu là video (null nếu không phải video)
  preview_url: string | null; // URL preview của video (null nếu không phải video)
  originalName: string;     // Tên gốc của file (originalname)
  mimeType: string;         // Kiểu MIME của file (ví dụ: 'image/jpeg', 'video/mp4', ...)
}
