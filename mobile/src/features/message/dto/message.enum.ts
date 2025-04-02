export enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  FILE = 'file',
}

export enum MessageViewStatus {
  SENDING = 'sending',
  SENT = 'sent',
  RECEIVED = 'received',
  VIEWED = 'viewed',
  REVOKED = 'revoked',
}

export enum CallStatus {
  CALLING = 'calling', //dùng cho nhóm
  CALLING_ACCEPT = 'calling_accept',
  CALLING_REJECT = 'calling_reject',
}

export enum MessageSource {
  SYSTEM = 'system',
  PEOBLE = 'peoble',
}