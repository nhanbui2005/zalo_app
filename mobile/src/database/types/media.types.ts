export interface IMedia {
    _id: string;
    roomId: string;
    msgId: string;
    name: string;
    type: string;
    fileUrl: string;
    callStatus?: string | null;
    previewImage?: string | null;
    duration?: number | null;
    size?: number | null;
    createdAt: number;
  }
  